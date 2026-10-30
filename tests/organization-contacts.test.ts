import test from 'node:test';
import assert from 'node:assert/strict';
import { ORGANIZATIONS } from '../src/canonical-data.js';
import {
  DNS_PUBLIC_ORGANIZATION_CONTACTS,
  DNS_IDENTITY_ORGANIZATION_DECISIONS,
  listDNSIdentityOrganizations,
  getDNSIdentityOrganization,
  validateDNSPublicOrganizationContacts,
} from '../src/public-organization-contacts.js';

test('public contacts have unique valid canonical associations', () => {
  assert.deepEqual(validateDNSPublicOrganizationContacts(), []);
  assert.equal(new Set(DNS_PUBLIC_ORGANIZATION_CONTACTS.map(c => c.id)).size, DNS_PUBLIC_ORGANIZATION_CONTACTS.length);
  assert.equal(listDNSIdentityOrganizations().length, ORGANIZATIONS.filter(o => o.active).length);
});
test('Cortina SEAM stays distinct from Sci Club ticket operator', () => {
  assert.equal(DNS_IDENTITY_ORGANIZATION_DECISIONS.cortina.organizationId, 'servizi-ampezzo');
  const ticket = DNS_PUBLIC_ORGANIZATION_CONTACTS.find(c => c.id === 'cortina-tickets');
  assert.equal(ticket?.organizationId, null);
  assert.equal(getDNSIdentityOrganization('servizi-ampezzo')?.id, 'servizi-ampezzo');
});
test('Val Gardena and Antholz retain canonical identities', () => {
  assert.equal(DNS_IDENTITY_ORGANIZATION_DECISIONS.valGardena.organizationId, 'val-gardena');
  assert.equal(DNS_IDENTITY_ORGANIZATION_DECISIONS.antholz.organizationId, 'antholzertal');
});
