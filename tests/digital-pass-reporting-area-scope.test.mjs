import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { loadDigitalPassActor } from '../server/digital-pass-auth.mjs';
import { checkDigitalCredential } from '../server/digital-pass-registration.mjs';

class MemoryDb {
  values = new Map();
  snapshot(key) { return { exists: this.values.has(key), data: () => structuredClone(this.values.get(key)) }; }
  collection(name) {
    return {
      doc: id => ({ key: name + '/' + id, get: async () => this.snapshot(name + '/' + id) }),
      where: (field, _op, value) => ({
        get: async () => ({ docs: [...this.values].filter(([key, record]) =>
          key.startsWith(name + '/') && record[field] === value).map(([key]) => this.snapshot(key)) }),
      }),
    };
  }
  async runTransaction(fn) {
    const staged = [];
    const result = await fn({
      get: async reference => this.snapshot(reference.key),
      create: (reference, value) => staged.push([reference.key, value]),
    });
    for (const [key, value] of staged) this.values.set(key, structuredClone(value));
    return result;
  }
}

const auth = { verifyIdToken: async token => ({ uid: token }) };
const dateNow = Date.parse('2026-11-12T12:00:00Z');

test('reporting-area grant is projected only through the caller active organization membership', async () => {
  const db = new MemoryDb();
  db.values.set('users/operator', { active: true, globalRoles: [] });
  db.values.set('memberships/operator__tv-toblach', {
    userId: 'operator', organizationId: 'tv-toblach', active: true,
  });
  db.values.set('organizations/tv-toblach', {
    active: true, reportingAreaIds: ['drei-zinnen'],
  });
  // A sibling organization shares the area, but is not in this user's membership.
  db.values.set('organizations/tv-niederdorf', {
    active: true, reportingAreaIds: ['drei-zinnen'],
  });
  db.values.set('accessGrants/operator__reportingArea__drei-zinnen', {
    userId: 'operator', scopeType: 'reportingArea', scopeId: 'drei-zinnen',
    active: true, permissions: ['passValidation.check'],
  });

  const actor = await loadDigitalPassActor({ db, auth, idToken: 'operator', now: dateNow });
  assert.deepEqual(actor.grants, [{
    organizationId: 'tv-toblach',
    reportingAreaId: 'drei-zinnen',
    permissions: ['passValidation.check'],
  }]);
});

test('reporting-area grant does not authorize an organization outside the area or an inactive membership', async () => {
  const db = new MemoryDb();
  db.values.set('users/operator', { active: true, globalRoles: [] });
  db.values.set('memberships/operator__tv-toblach', {
    userId: 'operator', organizationId: 'tv-toblach', active: true,
  });
  db.values.set('organizations/tv-toblach', {
    active: true, reportingAreaIds: ['osttirol'],
  });
  db.values.set('accessGrants/operator__reportingArea__drei-zinnen', {
    userId: 'operator', scopeType: 'reportingArea', scopeId: 'drei-zinnen',
    active: true, permissions: ['passValidation.check'],
  });

  assert.equal((await loadDigitalPassActor({ db, auth, idToken: 'operator', now: dateNow })).grants.length, 0);
  db.values.get('organizations/tv-toblach').reportingAreaIds = ['drei-zinnen'];
  db.values.get('memberships/operator__tv-toblach').active = false;
  assert.equal((await loadDigitalPassActor({ db, auth, idToken: 'operator', now: dateNow })).grants.length, 0);
});

test('QR validation is opaque across organizations and audits only an in-scope scan', async () => {
  const token = 'A'.repeat(43);
  const credentialId = createHash('sha256').update(token).digest('hex');
  const physicalPassId = 'b'.repeat(64);
  const qrPayload = 'dns-pass:v1:' + token;
  const db = new MemoryDb();
  db.values.set('digitalCredentials/' + credentialId, {
    physicalPassId, organizationId: 'tv-niederdorf', status: 'ACTIVE',
    seasonId: '2026-27', productCode: 'sk-dns', validFrom: 0, validUntil: 9999999999999,
  });
  db.values.set('passRegistrations/' + physicalPassId, {
    credentialId, status: 'ACTIVE', organizationId: 'tv-niederdorf',
  });
  const actor = { uid: 'operator', grants: [{
    organizationId: 'tv-toblach', reportingAreaId: 'drei-zinnen',
    permissions: ['passValidation.check'],
  }] };

  assert.deepEqual(await checkDigitalCredential({ db, actor, qrPayload, now: 10 }), { status: 'UNKNOWN' });
  assert.equal([...db.values.keys()].some(key => key.startsWith('passAuditEvents/')), false);

  actor.grants[0].organizationId = 'tv-niederdorf';
  assert.equal((await checkDigitalCredential({ db, actor, qrPayload, now: 10 })).status, 'VALID');
  const event = [...db.values.values()].find(value => value.action === 'CREDENTIAL_VALIDATED');
  assert.equal(event.organizationId, 'tv-niederdorf');
});
