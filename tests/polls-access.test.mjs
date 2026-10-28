import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizePollsNetwork } from '../server/polls-access.mjs';

const uid = 'user-123';
const now = Date.parse('2026-10-28T12:00:00Z');
const grantId = `${uid}__network__dolomiti-nordicski`;

function setup({ tokenUid = uid, revoked = false, profile = { active: true, globalRoles: [] },
  grant = null } = {}) {
  const values = new Map([['users/' + uid, profile]]);
  if (grant) values.set('accessGrants/' + grantId, grant);
  const auth = { verifyIdToken: async (token, checkRevoked) => {
    assert.equal(checkRevoked, true);
    if (token !== 'valid' || revoked) throw new Error('REVOKED');
    return { uid: tokenUid };
  } };
  const coreDb = { collection: name => ({ doc: id => ({
    get: async () => {
      const key = `${name}/${id}`;
      return { exists: values.has(key), data: () => values.get(key) };
    },
  }) }) };
  const check = (permission = 'events.manage', idToken = 'valid') =>
    authorizePollsNetwork({ auth, coreDb, permission, idToken, now });
  return { check };
}

const networkGrant = (permissions = ['events.manage']) => ({
  active: true, userId: uid, scopeType: 'network',
  scopeId: 'dolomiti-nordicski', permissions,
});

test('active DNS Core admin can manage events without any email whitelist', async () => {
  const { check } = setup({ profile: { active: true, globalRoles: ['dns-admin'] } });
  const actor = await check('events.manage');
  assert.equal(actor.uid, uid);
  assert.equal(actor.scopeType, 'network');
});

test('network scoped grant authorizes only the named permission', async () => {
  const { check } = setup({ grant: networkGrant() });
  await assert.doesNotReject(check('events.manage'));
  await assert.rejects(check('registrations.read'), /FORBIDDEN/);
  await assert.rejects(check('registrations.export'), /FORBIDDEN/);
});

test('disabled profile, absent profile and expired grants are forbidden', async () => {
  await assert.rejects(setup({ profile: { active: false, globalRoles: ['dns-admin'] } }).check(), /FORBIDDEN/);
  await assert.rejects(setup({ profile: null }).check(), /FORBIDDEN/);
  await assert.rejects(setup({
    grant: { ...networkGrant(), validTo: '2026-10-27' },
  }).check(), /FORBIDDEN/);
  await assert.rejects(setup({
    grant: { ...networkGrant(), validFrom: '2026-10-29' },
  }).check(), /FORBIDDEN/);
});

test('wrong scopes, revoked sessions and unsupported permissions cannot pass', async () => {
  const wrongScope = { ...networkGrant(), scopeType: 'organization', scopeId: 'org-x' };
  await assert.rejects(setup({ grant: wrongScope }).check(), /FORBIDDEN/);
  await assert.rejects(setup({ revoked: true, grant: networkGrant() }).check(), /REVOKED/);
  await assert.rejects(setup({ grant: networkGrant() }).check('billing.manage'), /FORBIDDEN/);
  await assert.rejects(setup({ grant: networkGrant() }).check('events.manage', ''), /UNAUTHORIZED/);
});

test('forged user IDs in grants are rejected', async () => {
  const { check } = setup({ grant: { ...networkGrant(), userId: 'another-user' } });
  await assert.rejects(check(), /FORBIDDEN/);
});
