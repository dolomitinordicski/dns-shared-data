/**
 * Digital Pass activation core — server-only, not exported by package.json.
 * Requires trusted Firebase Admin Firestore and caller-provided authorization
 * and canonical number resolution. No browser/client imports.
 */
import { randomInt, createHmac, randomUUID } from 'node:crypto';

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
  if (!assignment || !assignment.physicalPassId || !assignment.organizationId ||
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
  const code = generateActivationCode();
  const id = assignment.physicalPassId;
  const ref = db.collection('passActivationChallenges').doc(id);
  const auditRef = db.collection('passAuditEvents').doc(randomUUID());
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const value = snap.data();
      if (value.status === 'ENABLED' || value.status === 'CONSUMED' || value.status === 'CLAIM_PENDING') {
        throw new Error('PASS_ALREADY_ACTIVATED');
      }
      if (value.status === 'PREPARED' && value.expiresAt > now) {
        throw new Error('PREPARATION_ALREADY_EXISTS');
      }
      // A fresh prepare cannot overwrite any recorded sale, even when
      // a previously enabled code has expired.
      if (value.saleAttestedAt) throw new Error('SALE_ALREADY_ATTESTED');
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
      nonce: randomUUID(),
    });
    tx.create(auditRef, { action: 'PASS_ACTIVATION_PREPARED', targetId: id,
      actorId: actor.uid, organizationId: assignment.organizationId, at: now });
  });
  return { physicalPassId: id, code, expiresAt: now + 10 * 60 * 1000 };
}

/** Validate is operator's physical-sale attestation, not guest code redemption.
 * Transaction serializes concurrent validation and prevents two sales. */
export async function validateSale({
  db, actor, physicalPassId, now = Date.now(),
}) {
  const ref = db.collection('passActivationChallenges').doc(physicalPassId);
  const auditRef = db.collection('passAuditEvents').doc(randomUUID());
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('NO_PREPARATION');
    const record = snap.data();
    assertOperator(actor, record, 'passSale.attest');
    if (record.status === 'ENABLED' && record.operatorUid === actor.uid)
      return { status: 'SOLD_ATTESTED', alreadyValidated: true };
    if (record.status !== 'PREPARED' || record.expiresAt <= now)
      throw new Error('INVALID_PREPARATION');
    if (record.operatorUid !== actor.uid) throw new Error('PREPARED_BY_OTHER_OPERATOR');
    tx.update(ref, {
      status: 'ENABLED',
      saleAttestedAt: now,
      expiresAt: now + CODE_TTL_MS,
    });
    tx.create(auditRef, { action: 'PASS_SALE_ATTESTED', targetId: physicalPassId,
      actorId: actor.uid, organizationId: record.organizationId, at: now });
    return { status: 'SOLD_ATTESTED', alreadyValidated: false };
  });
}
