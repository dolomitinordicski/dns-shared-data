import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDigitalPassActor } from '../server/digital-pass-auth.mjs';

const today = Date.parse('2026-11-12T12:00:00Z');
function doc(data) { return { exists: !!data, data: () => data }; }
function dbWithDates({ validFrom, validTo }) {
  const membership = { userId: 'operator', organizationId: 'tv-toblach', active: true, validFrom, validTo };
  const grant = { userId: 'operator', scopeType: 'organization', scopeId: 'tv-toblach',
    active: true, validFrom, validTo, permissions: ['passValidation.check'] };
  return {
    collection(name) {
      if (name === 'users') return { doc: () => ({ get: async () => doc({ active: true, globalRoles: [] }) }) };
      if (name === 'memberships' || name === 'accessGrants') return {
        where: () => ({ get: async () => ({ docs: [doc(name === 'memberships' ? membership : grant)] }) }),
      };
      throw Error('Unexpected collection: ' + name);
    },
  };
}
const auth = { verifyIdToken: async () => ({ uid: 'operator' }) };
test('date-bounded active membership and grant allow authorized operator', async () => {
  const actor = await loadDigitalPassActor({
    db: dbWithDates({ validFrom: '2026-11-01', validTo: '2026-11-30' }),
    auth, idToken: 'operator', now: today,
  });
  assert.deepEqual(actor.grants, [{ organizationId: 'tv-toblach', permissions: ['passValidation.check'] }]);
});
test('future, expired, and malformed date-bounded grants fail closed', async () => {
  for (const dates of [
    { validFrom: '2026-11-13', validTo: '2026-12-01' },
    { validFrom: '2026-10-01', validTo: '2026-11-11' },
    { validFrom: '2026/11/01', validTo: '2026-11-30' },
  ]) {
    const actor = await loadDigitalPassActor({ db: dbWithDates(dates), auth, idToken: 'operator', now: today });
    assert.deepEqual(actor.grants, []);
  }
});
