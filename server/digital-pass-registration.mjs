import { randomBytes, createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import { hashActivationCode } from './digital-pass-activation.mjs';
const digest = value => createHash('sha256').update(value).digest('hex');
const ref = (db, collection, id) => db.collection(collection).doc(id);
const deny = () => new Error('INVALID_OR_EXPIRED_ACTIVATION');

/** A limiter shared by all instances. Keys are HMACed by the HTTP adapter. */
export async function limitAttempts({ db, key, now = Date.now(), max = 10, windowMs = 600000 }) {
  const target = ref(db, 'passRateLimits', digest(key));
  const allowed = await db.runTransaction(async tx => {
    const s = await tx.get(target); const old = s.exists ? s.data() : {};
    const current = old.until > now ? old : { count: 0, until: now + windowMs };
    if (current.count >= max) return false;
    tx.set(target, { count: current.count + 1, until: current.until }); return true;
  });
  if (!allowed) throw new Error('RATE_LIMITED');
}

/** Email ownership must be verified by Firebase Auth email-link sign-in.
 * The caller passes a freshly verified, revocation-checked token, never JSON claims.
 * No pending registration reserves a card before successful email verification. */
export async function registerDigitalPass({ db, identity, assignment, code, givenName, familyName,
  language = 'de', marketingRequested = false, marketingNoticeVersion, noticeVersion, hmacSecret, now = Date.now(), validFrom, validUntil }) {
  if (!identity?.uid || identity.email_verified !== true || typeof identity.email !== 'string') throw new Error('EMAIL_VERIFICATION_REQUIRED');
  if (!['de', 'it', 'en'].includes(language) || ![givenName, familyName].every(v => typeof v === 'string' && v.trim().length > 0 && v.length <= 100) ||
    typeof noticeVersion !== 'string' || !noticeVersion || noticeVersion.length > 100) throw new Error('INVALID_REGISTRATION');
  if (!Number.isFinite(validFrom) || !Number.isFinite(validUntil) || validFrom >= validUntil || now >= validUntil) throw new Error('INVALID_VALIDITY');
  if (!assignment || assignment.seasonId !== '2026-27' || assignment.productCode !== 'sk-dns') throw deny();
  const id = assignment.physicalPassId;
  await limitAttempts({ db, key: 'claim:' + identity.uid, now, max: 10 });
  await limitAttempts({ db, key: 'pass:' + id, now, max: 5 });
  const challengeRef = ref(db, 'passActivationChallenges', id);
  const registrationRef = ref(db, 'passRegistrations', id);
  const token = randomBytes(32).toString('base64url');
  const credentialId = digest(token);
  const result = await db.runTransaction(async tx => {
    const [challenge, existing] = await Promise.all([tx.get(challengeRef), tx.get(registrationRef)]);
    // Retry after lost response returns the same committed registration, without a new credential.
    if (existing.exists) {
      if (existing.data().holderUid !== identity.uid || existing.data().status !== 'ACTIVE') throw deny();
      return { registrationId: id, alreadyRegistered: true };
    }
    if (!challenge.exists || typeof code !== 'string' || !/^[A-HJ-NP-Z2-9]{6}$/.test(code)) throw deny();
    const record = challenge.data();
    const verifier = hashActivationCode(code, id, hmacSecret);
    if (record.status !== 'ENABLED' || record.expiresAt <= now || record.organizationId !== assignment.organizationId || record.sourceRevision !== assignment.sourceRevision ||
      typeof record.codeVerifier !== 'string' || record.codeVerifier.length !== 64 ||
      !timingSafeEqual(Buffer.from(record.codeVerifier), Buffer.from(verifier))) throw deny();
    tx.create(registrationRef, { physicalPassId: id, holderUid: identity.uid, status: 'ACTIVE',
      credentialId, organizationId: assignment.organizationId, seasonId: assignment.seasonId, completedAt: now });
    tx.set(ref(db, 'passHolders', identity.uid), { givenName: givenName.trim(), familyName: familyName.trim(),
      verifiedEmail: identity.email, language, emailVerifiedAt: now });
    tx.create(ref(db, 'digitalCredentials', credentialId), { physicalPassId: id, holderUid: identity.uid,
      status: 'ACTIVE', seasonId: assignment.seasonId, productCode: assignment.productCode, printedNumber: assignment.printedNumber,
      organizationId: assignment.organizationId, issuedAt: now, validFrom, validUntil });
    // Private holder-only payload: QR is high-entropy, opaque, revocable. Never logged or in audit/analytics.
    tx.create(ref(db, 'passCredentialPayloads', credentialId), { holderUid: identity.uid, token });
    tx.update(challengeRef, { status: 'CONSUMED', consumedAt: now });
    // Compatible with the existing Brevo adapter (#168); service verification is never marketing consent.
    const affirmative = marketingRequested === true && typeof marketingNoticeVersion === 'string' && marketingNoticeVersion.length > 0;
    tx.create(ref(db, 'consentEvents', randomUUID()), { holderId: identity.uid, purpose: 'DNS_MARKETING',
      affirmative, status: affirmative ? 'PENDING_DOUBLE_OPT_IN' : 'NOT_REQUESTED',
      noticeVersion: affirmative ? marketingNoticeVersion : noticeVersion, consentedAt: now, source: 'digital-pass', at: now });
    tx.create(ref(db, 'passAuditEvents', randomUUID()), { action: 'DIGITAL_PASS_ISSUED', targetId: credentialId,
      actorId: identity.uid, actorType: 'holder', organizationId: assignment.organizationId, at: now });
    return { registrationId: id, alreadyRegistered: false };
  });
  return result;
}

export async function getDigitalPass({ db, identity, physicalPassId }) {
  if (!identity?.uid || identity.email_verified !== true) throw new Error('UNAUTHORIZED');
  const registration = await ref(db, 'passRegistrations', physicalPassId).get();
  if (!registration.exists || registration.data().holderUid !== identity.uid) throw new Error('NOT_FOUND');
  const r = registration.data();
  const [credential, payload, holder] = await Promise.all([
    ref(db, 'digitalCredentials', r.credentialId).get(), ref(db, 'passCredentialPayloads', r.credentialId).get(),
    ref(db, 'passHolders', identity.uid).get(),
  ]);
  if (!credential.exists || !holder.exists || !payload.exists) throw new Error('NOT_FOUND');
  const c = credential.data(), h = holder.data();
  return { holderName: h.givenName + ' ' + h.familyName, printedNumber: c.printedNumber,
    productCode: c.productCode, seasonId: c.seasonId, status: c.status,
    validFrom: c.validFrom, validUntil: c.validUntil, qrPayload: 'dns-pass:v1:' + payload.data().token };
}

export async function checkDigitalCredential({ db, actor, qrPayload, now = Date.now() }) {
  if (!actor?.uid || !(actor.isDnsAdmin === true || actor.grants?.some(g => g.permissions?.includes('passValidation.check')))) throw new Error('FORBIDDEN');
  if (typeof qrPayload !== 'string' || !/^dns-pass:v1:[A-Za-z0-9_-]{43}$/.test(qrPayload)) return { status: 'UNKNOWN' };
  const credentialId = digest(qrPayload.slice('dns-pass:v1:'.length));
  return db.runTransaction(async tx => {
    const credential = await tx.get(ref(db, 'digitalCredentials', credentialId));
    if (!credential.exists) return { status: 'UNKNOWN' };
    const c = credential.data();
    const registration = await tx.get(ref(db, 'passRegistrations', c.physicalPassId));
    let status = 'UNKNOWN';
    if (c.status !== 'ACTIVE' || !registration.exists || registration.data().status !== 'ACTIVE' || registration.data().credentialId !== credentialId) status = 'REVOKED';
    else if (!Number.isFinite(c.validFrom) || !Number.isFinite(c.validUntil) || c.seasonId !== '2026-27' || c.productCode !== 'sk-dns') status = 'UNKNOWN';
    else if (now < c.validFrom || now >= c.validUntil) status = 'EXPIRED';
    else status = 'VALID';
    tx.create(ref(db, 'passAuditEvents', randomUUID()), { action: 'CREDENTIAL_VALIDATED', targetId: credentialId,
      actorId: actor.uid, result: status, at: now });
    return { status, seasonId: c.seasonId, productCode: c.productCode };
  });
}

export async function revokeDigitalCredential({ db, actor, credentialId, reason, now = Date.now() }) {
  if (!actor?.uid || actor.isDnsAdmin !== true) throw new Error('FORBIDDEN');
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 500) throw new Error('REASON_REQUIRED');
  return db.runTransaction(async tx => {
    const target = ref(db, 'digitalCredentials', credentialId), s = await tx.get(target);
    if (!s.exists) throw new Error('NOT_FOUND');
    if (s.data().status === 'REVOKED') return { status: 'REVOKED', alreadyRevoked: true };
    tx.update(target, { status: 'REVOKED', revokedAt: now });
    tx.create(ref(db, 'passAuditEvents', randomUUID()), { action: 'DIGITAL_PASS_REVOKED', targetId: credentialId, actorId: actor.uid, reason, at: now });
    return { status: 'REVOKED', alreadyRevoked: false };
  });
}
