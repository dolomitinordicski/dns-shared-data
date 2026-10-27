/**
 * Trusted DNS Partner Hub activation service.
 * Adapter contract: Firebase Admin Auth + Firestore Admin database.
 * Only invoke after verifying a Firebase ID token on a protected backend.
 * No OTP issuance here: verified email must come from Firebase Auth (email-link
 * sign-in or provider verification) and must match the DNS authorized contact.
 * No production routes, credentials or deployment in this module.
 */
import { createHash } from 'node:crypto';
import { canActivateContact, eligibleActivationContact, normalizePartnerEmail } from './partner-activation-policy.mjs';

export function contactLookupId(email) {
  const normalized = normalizePartnerEmail(email);
  if (!normalized || !normalized.includes('@')) throw new Error('Invalid contact email');
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function createPartnerProvisioningService({ auth, db, clock = () => new Date().toISOString() }) {
  if (!auth?.getUser || !db?.runTransaction || !db?.collection) throw new TypeError('Admin Auth and Firestore are required');

  /**
   * "partnerActivationContacts/<sha256(email)>" is created ONLY by DNS
   * trusted administration from its authorized contact register.
   * Record: { contacts: [{organizationId, establishmentId, active, email}],
   *           active: true }
   * Direct client access to this collection must remain denied.
   */
  return {
    async activateVerifiedMember(uid) {
      if (typeof uid !== 'string' || !uid) throw new TypeError('Verified UID required');
      const user = await auth.getUser(uid);
      if (user.disabled || !user.email || !user.emailVerified) return { activated: false, reason: 'verification-required' };

      const email = normalizePartnerEmail(user.email);
      const lookup = db.collection('partnerActivationContacts').doc(contactLookupId(email));
      return db.runTransaction(async tx => {
        const lookupSnap = await tx.get(lookup);
        const data = lookupSnap.exists ? lookupSnap.data() : null;
        const contact = data?.active === true ? eligibleActivationContact(data.contacts) : null;
        if (!contact || !contact.organizationId || !contact.establishmentId
          || !canActivateContact({ authorizedEmail: contact.email, authenticatedEmail: email, emailVerified: user.emailVerified, active: contact.active })) {
          return { activated: false, reason: 'contact-review-required' };
        }

        // Stable one-user/one-organization provision IDs. Another organization
        // cannot be silently claimed via a public establishment ID.
        const profileRef = db.collection('users').doc(uid);
        const membershipRef = db.collection('memberships').doc(uid + '__' + contact.organizationId);
        const grantRef = db.collection('accessGrants').doc(uid + '__organization__' + contact.organizationId);
        const establishmentRef = db.collection('partnerEstablishments').doc(contact.establishmentId);
        const [profile, membership, grant, establishment] = await Promise.all([
          tx.get(profileRef), tx.get(membershipRef), tx.get(grantRef), tx.get(establishmentRef),
        ]);
        if (!establishment.exists || establishment.data().organizationId !== contact.organizationId) {
          return { activated: false, reason: 'contact-review-required' };
        }
        if (membership.exists && (membership.data().active !== true || membership.data().userId !== uid
          || membership.data().organizationId !== contact.organizationId)) {
          return { activated: false, reason: 'account-review-required' };
        }
        if (grant.exists && (grant.data().active !== true || grant.data().userId !== uid
          || grant.data().scopeId !== contact.organizationId)) {
          return { activated: false, reason: 'account-review-required' };
        }
        if (profile.exists && profile.data().active === false) {
          return { activated: false, reason: 'account-review-required' };
        }
        const timestamp = clock();
        if (!profile.exists) tx.create(profileRef, {
          id: uid, active: true, globalRoles: [], createdAt: timestamp, updatedAt: timestamp,
        });
        if (!membership.exists) tx.create(membershipRef, {
          id: membershipRef.id, userId: uid, organizationId: contact.organizationId,
          role: 'contributor', active: true, createdAt: timestamp, updatedAt: timestamp,
        });
        if (!grant.exists) tx.create(grantRef, {
          id: grantRef.id, userId: uid, scopeType: 'organization', scopeId: contact.organizationId,
          // This minimal right must be supported by the deployed Access Control
          // contract AND rules BEFORE callers are granted access to real data.
          permissions: ['partner.read'], active: true, grantedBy: 'partner-activation',
          grantReason: 'registered-email', createdAt: timestamp, updatedAt: timestamp,
        });
        const eventRef = db.collection('partnerActivationEvents').doc(uid + '__' + contact.organizationId);
        const event = await tx.get(eventRef);
        if (!event.exists) tx.create(eventRef, {
          uid, organizationId: contact.organizationId, establishmentId: contact.establishmentId,
          type: 'registered-email-activation', createdAt: timestamp,
        });
        return { activated: true, organizationId: contact.organizationId, establishmentId: contact.establishmentId,
          alreadyProvisioned: membership.exists && grant.exists };
      });
    },
  };
}
