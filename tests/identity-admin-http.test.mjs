import test from 'node:test';
import assert from 'node:assert/strict';
import { createIdentityAdminHandler } from '../server/identity-admin-http.mjs';

const organizations = [{ id: 'tv-toblach', active: true, organizationType: 'tourism-organisation', reportingAreaIds: ['drei-zinnen'] }];
function res() { return { code: 200, body: null, set() { return this; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
function request(headers = { authorization: 'Bearer synthetic' }) {
  return { method: 'POST', path: '/v1/area-admin/provision-existing', headers,
    body: { uid: 'synthetic-123', organizationId: 'tv-toblach', reportingAreaId: 'drei-zinnen' } };
}
test('disabled by default', async () => {
  const response = res();
  await createIdentityAdminHandler({})(request(), response);
  assert.equal(response.code, 503);
});
test('reject missing bearer token before accessing auth', async () => {
  const response = res();
  await createIdentityAdminHandler({ enabled: true })(request({}), response);
  assert.equal(response.code, 401);
});
test('reject caller without DNS admin role', async () => {
  const response = res();
  const auth = { verifyIdToken: async () => ({ uid: 'synthetic-caller' }) };
  const db = { collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({ active: true, globalRoles: [] }) }) }) }) };
  await createIdentityAdminHandler({ enabled: true, auth, db, organizations })(request(), response);
  assert.equal(response.code, 403);
});

test('reject unsupported HTTP verbs', async () => {
  const response = res();
  await createIdentityAdminHandler({ enabled: true })({ ...request(), method: 'GET' }, response);
  assert.equal(response.code, 405);
});
