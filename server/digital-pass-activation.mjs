/**
 * Digital Pass activation core — server-only, not exported by package.json.
 * Requires trusted Firebase Admin Firestore and caller-provided authorization
 * and canonical number resolution. No browser/client imports.
 */
import { randomInt, createHmac, randomUUID } from 'node:crypto';
import {activationRetention, auditRetention} from './digital-pass-retention.mjs';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 24 * 60 * 60 * 1000;

export function generateActivationCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

export function hashActivationCode(code, physicalPassId, secretKey) {
  if (typeof secretKey !== 'string' || secretKey.length < 32) {
    throw new Error('Activation HMAC key must be configured securely (min 32 chars)');
  }
  return createHmac('sha256', secretKey)
    .update('dns-pass-activation:v1\0')
    .update(physicalPassId)
    .update('\0')
    .update(code)
    .digest('hex');
}

function assertOperator(actor, assignment, requiredPermission) {
  if (!actor || typeof actor.uid !== 'string' || !actor.uid) throw new Error('UNAUTHORIZED');
  if (actor.isDnsAdmin === true) return;
  if (!Array.isArray(actor.grants) || !actor.grants.some(g =>
    g.organizationId === assignment.organizationId &&
    Array.isArray(g.permissions) && g.permissions.includes(requiredPermission)
  )) throw new Error('FORBIDDEN');
}

function requireAssignment(assignment) {
  if (!assignment || assignment.seasonId !== '2026-27' || assignment.productCode !== 'sk-dns' || !assignment.sourceRevision || !assignment.physicalPassId || !assignment.organizationId ||
      !assignment.seasonId || !assignment.productCode ||
      assignment.eligibleForDnsSeasonPilot !== true) {
    throw new Error('NOT_ELIGIBLE');
  }
}

/**
 * prepare: lookup must resolve from authoritative versioned matrix, not input claims.
 * Challenge is staged for 10 minutes; plaintext is returned only once.
 * The Firestore document ID is the opaque physicalPassId; caller must ensure
 * season/product-number uniqueness in its canonical inventory resolver.
 */
export async function prepareActivation({
  db, actor, passNumber, seasonId, productCode, resolveAssignment, hmacSecret,
  now = Date.now(),
}) {
  if (typeof resolveAssignment !== 'function') throw new Error('NO_INVENTORY_RESOLVER');
  const assignment = await resolveAssignment({ passNumber, seasonId, productCode });
  requireAssignment(assignment);
  assertOperator(actor, assignment, 'passActivation.issue');
  // Separate authorization confirms physical possession; no commercial attestation.
  assertOperator(actor, assignment, 'passPossession.attest');
  const code = generateActivationCode();
  const id = assignment.physicalPassId;
  const nonce = randomUUID();
  const ref = db.collection('passActivationChallenges').doc(id);
  const auditRef = db.collection('passAuditEvents').doc(randomUUID());
  await db.runTransaction(async tx => {
    const [snap, registration] = await Promise.all([
      tx.get(ref), tx.get(db.collection('passRegistrations').doc(id)),
    ]);
    // The one-card guard survives TTL deletion of the short-lived challenge.
    if (registration.exists) throw new Error('PASS_ALREADY_ACTIVATED');
    if (snap.exists) {
      const value = snap.data();
      if (value.status === 'ENABLED' || value.status === 'CONSUMED' || value.status === 'CLAIM_PENDING') {
        throw new Error('PASS_ALREADY_ACTIVATED');
      }
      if (value.status === 'PREPARED' && value.expiresAt > now) {
        throw new Error('PREPARATION_ALREADY_EXISTS');
      }
      // A fresh prepare cannot overwrite any recorded possession confirmation, even when
      // a previously enabled code has expired.
      if (value.possessionConfirmedAt != null) throw new Error('POSSESSION_ALREADY_CONFIRMED');
    }
    tx.set(ref, {
      physicalPassId: id,
      organizationId: assignment.organizationId,
      seasonId: assignment.seasonId,
      productCode: assignment.productCode,
      codeVerifier: hashActivationCode(code, id, hmacSecret),
      status: 'PREPARED',
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000,
      operatorUid: actor.uid,
      qrClaimEnabled: true,
      nonce,
      sourceRevision: assignment.sourceRevision,
      printedNumber: assignment.printedNumber,
      ...activationRetention(now + 10 * 60 * 1000),
    });
    tx.create(auditRef, { action: 'PASS_ACTIVATION_PREPARED', targetId: id,
      actorId: actor.uid, organizationId: assignment.organizationId, at: now, ...auditRetention(now) });
  });
  return { physicalPassId: id, preparationId: nonce, code, expiresAt: now + 10 * 60 * 1000 };
}

/** Validate is operator's physical-card possession confirmation, not guest code redemption.
 * Transaction serializes concurrent validation and prevents duplicate associations. */
export async function confirmPossession({
  db, actor, physicalPassId, preparationId, now = Date.now(),
}) {
  const ref = db.collection('passActivationChallenges').doc(physicalPassId);
  const auditRef = db.collection('passAuditEvents').doc(randomUUID());
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('NO_PREPARATION');
    const record = snap.data();
    assertOperator(actor, record, 'passPossession.attest');
    if (!preparationId || record.nonce !== preparationId) throw new Error('STALE_PREPARATION');
    if (record.possessionConfirmedAt != null && record.operatorUid === actor.uid)
      return { status: 'POSSESSION_CONFIRMED', alreadyValidated: true };
    if (record.status !== 'PREPARED' || record.expiresAt <= now)
      throw new Error('INVALID_PREPARATION');
    if (record.operatorUid !== actor.uid) throw new Error('PREPARED_BY_OTHER_OPERATOR');
    tx.update(ref, {
      status: 'ENABLED',
      possessionStatus: 'POSSESSION_CONFIRMED',
      possessionConfirmedAt: now,
      expiresAt: now + CODE_TTL_MS,
      ...activationRetention(now + CODE_TTL_MS),
    });
    tx.create(auditRef, { action: 'PASS_POSSESSION_CONFIRMED', targetId: physicalPassId,
      actorId: actor.uid, organizationId: record.organizationId, at: now, ...auditRetention(now) });
    return { status: 'POSSESSION_CONFIRMED', alreadyValidated: false };
  });
}

/** DNS administrator recovery for an expired/unusable enabled code. The existing
 * possession verification is preserved; registered cards can never be reissued here. */
export async function reissueActivation({ db, actor, physicalPassId, idempotencyKey, reason, hmacSecret, now = Date.now() }) {
  if (!actor?.uid || actor.isDnsAdmin !== true) throw new Error('FORBIDDEN');
  if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9-]{16,128}$/.test(idempotencyKey) ||
      typeof reason !== 'string' || !reason.trim() || reason.length > 500) throw new Error('INVALID_REISSUE');
  const ref = db.collection('passActivationChallenges').doc(physicalPassId);
  const registrationRef = db.collection('passRegistrations').doc(physicalPassId);
  const auditRef = db.collection('passAuditEvents').doc(randomUUID());
  let code = generateActivationCode();
  let verifier = hashActivationCode(code, physicalPassId, hmacSecret);
  const nonce = randomUUID();
  return db.runTransaction(async tx => {
    const [snap, registration] = await Promise.all([tx.get(ref), tx.get(registrationRef)]);
    if (!snap.exists) throw new Error('NO_PREPARATION');
    const record = snap.data();
    if (record.lastReissueKey === idempotencyKey) return { physicalPassId, alreadyReissued: true, status: record.status };
    if (record.possessionConfirmedAt == null || registration.exists || record.seasonId !== '2026-27' || record.productCode !== 'sk-dns' ||
        !['ENABLED','EXPIRED'].includes(record.status)) throw new Error('CANNOT_REISSUE');
    while (verifier === record.codeVerifier) { code = generateActivationCode(); verifier = hashActivationCode(code, physicalPassId, hmacSecret); }
    tx.update(ref, { codeVerifier: verifier, status: 'ENABLED', nonce, expiresAt: now + CODE_TTL_MS,
      lastReissueKey: idempotencyKey, reissuedAt: now, reissuedBy: actor.uid, ...activationRetention(now + CODE_TTL_MS) });
    tx.create(auditRef, { action: 'PASS_ACTIVATION_REISSUED', targetId: physicalPassId,
      actorId: actor.uid, organizationId: record.organizationId, reason: reason.trim(), at: now, ...auditRetention(now) });
    return { physicalPassId, preparationId: nonce, code, expiresAt: now + CODE_TTL_MS, alreadyReissued: false };
  });
}

/**
 * Customer QR claim: email-verified holder proves possession of the one-time
 * challenge issued by an authorized authorized operator.
 * The transaction is the only place that changes PREPARED -> ENABLED.
 * Mere QR GET/rendering can never confirm possession.
 */
export async function claimPreparedPossession({
  db, identity, assignment, code, hmacSecret, now = Date.now(),
}) {
  if (!identity?.uid || identity.email_verified !== true) throw new Error('UNAUTHORIZED');
  requireAssignment(assignment);
  if (typeof code !== 'string' || !/^[A-HJ-NP-Z2-9]{6}$/.test(code))
    throw new Error('INVALID_OR_EXPIRED');
  const id = assignment.physicalPassId;
  const recordRef = db.collection('passActivationChallenges').doc(id);
  const auditRef = db.collection('passAuditEvents').doc(randomUUID());
  return db.runTransaction(async tx => {
    const snap = await tx.get(recordRef);
    if (!snap.exists) throw new Error('INVALID_OR_EXPIRED');
    const record = snap.data();
    if (record.qrClaimEnabled !== true || record.organizationId !== assignment.organizationId ||
        record.sourceRevision !== assignment.sourceRevision ||
        record.seasonId !== assignment.seasonId || record.productCode !== assignment.productCode ||
        typeof record.codeVerifier !== 'string' || record.codeVerifier.length !== 64)
      throw new Error('INVALID_OR_EXPIRED');
    const expected = hashActivationCode(code, id, hmacSecret);
    // Constant-time verifier comparison, including correctly sized malformed values.
    const { timingSafeEqual } = await import('node:crypto');
    const left = Buffer.from(record.codeVerifier, 'hex');
    const right = Buffer.from(expected, 'hex');
    if (left.length !== right.length || !timingSafeEqual(left, right))
      throw new Error('INVALID_OR_EXPIRED');
    if (record.possessionConfirmedAt != null) {
      if (record.claimedByUid !== identity.uid) throw new Error('INVALID_OR_EXPIRED');
      return { status: 'POSSESSION_CONFIRMED', alreadyClaimed: true };
    }
    if (record.status !== 'PREPARED' || record.expiresAt <= now ||
        !record.operatorUid || !record.nonce) throw new Error('INVALID_OR_EXPIRED');
    tx.update(recordRef, {
      status: 'ENABLED', possessionStatus: 'POSSESSION_CONFIRMED',
      possessionConfirmedAt: now, expiresAt: now + CODE_TTL_MS,
      claimedByUid: identity.uid, possessionMethod: 'CUSTOMER_QR_CLAIM',
      ...activationRetention(now + CODE_TTL_MS),
    });
    tx.create(auditRef, { action: 'PASS_POSSESSION_CONFIRMED', targetId: id,
      actorId: record.operatorUid, customerUid: identity.uid, organizationId: record.organizationId,
      preparationId: record.nonce, method: 'CUSTOMER_QR_CLAIM', at: now, ...auditRetention(now) });
    return { status: 'POSSESSION_CONFIRMED', alreadyClaimed: false };
  });
}

/** Staff-only, scoped status for the exact preparation generation. */
export async function getPreparedPossessionStatus({ db, actor, physicalPassId, preparationId, now = Date.now() }) {
  if (typeof physicalPassId !== 'string' || typeof preparationId !== 'string' ||
      !physicalPassId || !preparationId) throw new Error('INVALID_PREPARATION');
  const snap = await db.collection('passActivationChallenges').doc(physicalPassId).get();
  if (!snap.exists) throw new Error('NO_PREPARATION');
  const record = snap.data();
  assertOperator(actor, record, 'passPossession.attest');
  if (record.nonce !== preparationId || record.operatorUid !== actor.uid && actor.isDnsAdmin !== true)
    throw new Error('STALE_PREPARATION');
  if (record.possessionConfirmedAt != null) return { status: 'POSSESSION_CONFIRMED' };
  if (record.status === 'PREPARED' && record.expiresAt > now) return { status: 'PENDING' };
  return { status: 'EXPIRED' };
}
