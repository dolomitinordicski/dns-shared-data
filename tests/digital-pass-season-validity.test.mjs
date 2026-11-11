import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryDb } from './helpers/digital-pass-memory-db.mjs';
import { prepareActivation, confirmPossession } from '../server/digital-pass-activation.mjs';
import { registerDigitalPass, getDigitalPass, checkDigitalCredential, revokeDigitalCredential } from '../server/digital-pass-registration.mjs';
import { issueDynamicQr, PRESENTATION_TTL_MS } from '../server/digital-pass-dynamic-qr.mjs';
import { verifyPublicPass, renderPublicPassHtml } from '../server/digital-pass-public-verify.mjs';

// Explicit domain timestamps in an isolated in-memory database. No production
// access, real identities or change to the system clock.
const beforeSeason = Date.parse('2026-11-11T13:00:00+01:00');
const validFrom = Date.parse('2026-11-15T00:00:00+01:00');
const validUntil = Date.parse('2027-05-01T00:00:00+02:00');
const identity = { uid: 'synthetic-holder', email: 'holder@example.test', email_verified: true };
const actor = { uid: 'synthetic-operator', isDnsAdmin: true };
const assignment = { physicalPassId: 'synthetic-physical-pass', organizationId: 'synthetic-org',
  seasonId: '2026-27', productCode: 'sk-dns', printedNumber: '000123', sourceRevision: 'synthetic', eligibleForDnsSeasonPilot: true };
const hmacSecret = 'synthetic-only-hmac-key-never-for-production';

test('preseason issuance and dynamic QR preserve official validity and do not imply marketing consent', async () => {
  const db = new MemoryDb();
  const prepared = await prepareActivation({ db, actor, passNumber: '000123', seasonId: '2026-27', productCode: 'sk-dns',
    resolveAssignment: async () => assignment, hmacSecret, now: beforeSeason });
  await confirmPossession({ db, actor, ...prepared, now: beforeSeason + 1 });
  const input = { db, identity, assignment, code: prepared.code, givenName: 'Synthetic', familyName: 'Holder',
    noticeVersion: 'synthetic-notice', hmacSecret, validFrom, validUntil, now: beforeSeason + 2 };
  await registerDigitalPass(input);
  assert.equal((await registerDigitalPass(input)).alreadyRegistered, true);
  assert.equal([...db.values.keys()].filter(k => k.startsWith('digitalCredentials/')).length, 1);
  const pass = await getDigitalPass({ db, identity, physicalPassId: assignment.physicalPassId });
  assert.equal(pass.status, 'ACTIVE'); // Issued, distinct from seasonal validity.
  assert.equal(pass.validFrom, validFrom);
  assert.equal(pass.validUntil, validUntil);
  const qr = await issueDynamicQr({ db, identity, physicalPassId: assignment.physicalPassId, now: beforeSeason + 3 });
  assert.equal((await checkDigitalCredential({ db, actor, qrPayload: qr.qrPayload, now: beforeSeason + 4 })).status, 'NOT_YET_VALID');
  assert.equal(await verifyPublicPass({ db, token: qr.qrPayload.slice(12), dynamic: true, now: beforeSeason + 4 }), 'NOT_YET_VALID');
  assert.equal(await verifyPublicPass({ db, token: qr.qrPayload.slice(12), dynamic: true, now: beforeSeason + 3 + PRESENTATION_TTL_MS }), 'UNKNOWN');
  await assert.rejects(getDigitalPass({ db, identity: { ...identity, uid: 'other-holder' }, physicalPassId: assignment.physicalPassId }), /NOT_FOUND/);
  const consent = [...db.values.values()].find(v => v.purpose === 'DNS_MARKETING');
  assert.equal(consent.affirmative, false);
  assert.equal(consent.status, 'NOT_REQUESTED');
  const payloadToken = pass.qrPayload.slice(12);
  for (const [now, expected] of [[validFrom - 1, 'NOT_YET_VALID'], [validFrom, 'VALID'], [validUntil - 1, 'VALID'], [validUntil, 'EXPIRED']]) {
    assert.equal((await checkDigitalCredential({ db, actor, qrPayload: pass.qrPayload, now })).status, expected);
    assert.equal(await verifyPublicPass({ db, token: payloadToken, now }), expected);
  }
  const credentialId = db.values.get('passRegistrations/' + assignment.physicalPassId).credentialId;
  await revokeDigitalCredential({ db, actor, credentialId, reason: 'Synthetic test', now: beforeSeason + 5 });
  assert.equal(await verifyPublicPass({ db, token: payloadToken, now: beforeSeason + 6 }), 'REVOKED');
});

test('preseason public status is explicit and never presents a green valid signal', () => {
  const html = renderPublicPassHtml('NOT_YET_VALID');
  assert.match(html, /NON ANCORA VALIDO/);
  assert.match(html, /NOT YET VALID/);
  assert.doesNotMatch(html, /#11764c|holderName|email|printedNumber|credentialId/);
});
