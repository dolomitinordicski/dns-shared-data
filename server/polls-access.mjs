/** Trusted DNS Core authorization for the separate dns-polls data domain.
 * No browser roles, emails, or scopes are accepted as proof of permissions. */
const POLLS_PERMISSIONS = new Set([
  'polls.read', 'polls.manage', 'events.read', 'events.manage',
  'registrations.read', 'registrations.export',
]);
const NETWORK_ID = 'dolomiti-nordicski';

function activeGrant(grant, now) {
  if (!grant || grant.active !== true) return false;
  const date = new Date(now).toISOString().slice(0, 10);
  return (!grant.validFrom || /^\d{4}-\d{2}-\d{2}$/.test(grant.validFrom) && grant.validFrom <= date)
    && (!grant.validTo || /^\d{4}-\d{2}-\d{2}$/.test(grant.validTo) && grant.validTo >= date);
}

export async function authorizePollsNetwork({ auth, coreDb, idToken, permission, now = Date.now() }) {
  if (!POLLS_PERMISSIONS.has(permission)) throw new Error('FORBIDDEN');
  if (typeof idToken !== 'string' || !idToken) throw new Error('UNAUTHORIZED');
  // verifyIdToken(..., true) also rejects revoked Firebase Auth sessions.
  const identity = await auth.verifyIdToken(idToken, true);
  const uid = identity?.uid;
  if (typeof uid !== 'string' || !uid) throw new Error('UNAUTHORIZED');
  const profile = await coreDb.collection('users').doc(uid).get();
  if (!profile.exists || profile.data()?.active !== true) throw new Error('FORBIDDEN');

  if (profile.data().globalRoles?.includes('dns-admin') === true) {
    return { uid, scopeType: 'network', scopeId: NETWORK_ID, permission };
  }
  // Current events have no canonical organization/area scope. Until the
  // schema carries one, no area/organization grant can authorize global PII.
  const grant = await coreDb.collection('accessGrants')
    .doc(`${uid}__network__${NETWORK_ID}`).get();
  const value = grant.exists ? grant.data() : null;
  if (!activeGrant(value, now) ||
      value.userId !== uid || value.scopeType !== 'network' ||
      value.scopeId !== NETWORK_ID ||
      !Array.isArray(value.permissions) || !value.permissions.includes(permission)) {
    throw new Error('FORBIDDEN');
  }
  return { uid, scopeType: 'network', scopeId: NETWORK_ID, permission };
}
