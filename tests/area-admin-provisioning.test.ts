import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareAreaAdminProvisioning } from '../src/area-admin-provisioning.js';

test('Toblach Area Admin is scoped to 3 Zinnen and cannot administer globally', () => {
  const result = prepareAreaAdminProvisioning({
    uid: 'area-admin-test-123', organizationId: 'tv-toblach',
    reportingAreaId: 'drei-zinnen', preferredLanguage: 'de',
  });
  assert.equal(result.membership.organizationId, 'tv-toblach');
  assert.deepEqual(result.user.globalRoles, []);
  assert.equal(result.grant.scopeId, 'drei-zinnen');
  assert.equal(result.grant.permissions.includes('flyer.write'), true);
  assert.equal(result.grant.permissions.includes('ticketSales.write'), true);
  assert.equal(result.grant.permissions.includes('ticketSales.verify'), false);
  assert.equal(result.grant.permissions.includes('season.manage'), false);
});
test('reject cross-area membership', () => {
  assert.throws(() => prepareAreaAdminProvisioning({
    uid: 'area-admin-test-123', organizationId: 'tv-toblach',
    reportingAreaId: 'antholzertal', preferredLanguage: 'it',
  }), /not related/);
});
test('reject network operator as ordinary Area Admin', () => {
  assert.throws(() => prepareAreaAdminProvisioning({
    uid: 'area-admin-test-123', organizationId: 'dolomiti-nordicski',
    reportingAreaId: 'drei-zinnen', preferredLanguage: 'it',
  }), /not eligible/);
});
