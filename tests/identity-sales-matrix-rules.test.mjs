import { before, after, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, writeBatch, updateDoc } from 'firebase/firestore';
import { VIRTUAL_AREA as A, VIRTUAL_IDENTITIES as U, virtualPolicy } from './fixtures/virtual-dns-area.mjs';
const orgs = [A.organizationId, A.secondaryOrganizationId, A.foreignOrganizationId];
let env, writer, admin, outsider, anonymous;
function sale(org, uid = U.writer) {
  const id = `2026-27__${org}__${A.reportingAreaId}__day__official__regular`;
  return { id, draftKey: 'dns-test-draft', seasonId: '2026-27', organizationId: org,
    reportingAreaId: A.reportingAreaId, productCode: 'day', salesChannel: 'official', salesPeriod: 'regular',
    quantity: 10, amountOverride: null, amountOverrideReason: '',
    pricing: { pricingConfigId: 'dns-test-price', unitPrice: 10, settlementUnitPrice: 10, currency: 'EUR' },
    calculatedAmount: 100, revision: 1,
    provenance: { sourceSystem: 'manual-data-entry', methodVersion: 1, dataStatus: 'draft' },
    updatedBy: uid, updatedAt: serverTimestamp() };
}
before(async () => {
  if (process.env.GCLOUD_PROJECT !== 'demo-dns-identity' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8188') {
    throw new Error('Only the dedicated loopback demo emulator is permitted');
  }
  env = await initializeTestEnvironment({ projectId: 'demo-dns-identity', firestore: {
    host: '127.0.0.1', port: 8188, rules: readFileSync('firestore.rules', 'utf8') } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore(); const put = (path, value) => setDoc(doc(db, path), value);
    await put(`users/${U.writer}`, { active: true, globalRoles: [] });
    await put(`users/${U.admin}`, { active: true, globalRoles: ['dns-admin'] });
    await put(`users/${U.outsider}`, { active: true, globalRoles: [] });
    await put('seasons/2026-27', { status: 'active' });
    await put(`reportingAreas/${A.reportingAreaId}`, A);
    await put('ticketPricingConfigs/dns-test-price', { active: true, seasonId: '2026-27', scopeType: 'reportingArea', scopeId: A.reportingAreaId,
      productCode: 'day', salesChannel: 'official', salesPeriod: 'regular', unitPrice: 10, settlementUnitPrice: 10 });
    for (const [i, org] of orgs.entries()) {
      await put(`organizations/${org}`, { ...A, id: org, reportingAreaIds: [A.reportingAreaId] });
      await put(`organizationToolAccess/${org}`, { ...virtualPolicy(['write', 'read', 'none'][i]), organizationId: org });
      await put(`memberships/${U.writer}__${org}`, { userId: U.writer, organizationId: org, active: true });
      await put(`accessGrants/${U.writer}__organization__${org}`, { userId: U.writer, active: true, permissions: ['ticketSales.read', 'ticketSales.write'] });
    }
  });
  writer = env.authenticatedContext(U.writer).firestore(); admin = env.authenticatedContext(U.admin).firestore();
  outsider = env.authenticatedContext(U.outsider).firestore(); anonymous = env.unauthenticatedContext().firestore();
});
after(async () => { if (env) await env.cleanup(); });
test('W sales create and atomic archived update fit the access-call budget', async () => {
  const data = sale(orgs[0]), ref = doc(writer, 'ticketSales', data.id);
  await assertSucceeds(setDoc(ref, data));
  const before = (await assertSucceeds(getDoc(ref))).data();
  const batch = writeBatch(writer);
  batch.set(doc(writer, 'ticketSales', data.id, 'revisions', '1'), before);
  batch.set(ref, { ...data, quantity: 11, calculatedAmount: 110, revision: 2 });
  await assertSucceeds(batch.commit());
});
for (const [i, level] of [[1, 'R'], [2, 'none']]) {
  test(`${level} continues to cap sales grants`, async () => {
    const data = sale(orgs[i]);
    await assertFails(setDoc(doc(writer, 'ticketSales', data.id), data));
    await assertSucceeds(setDoc(doc(admin, 'ticketSales', data.id), { ...data, updatedBy: U.admin }));
    await (i === 1 ? assertSucceeds : assertFails)(getDoc(doc(writer, 'ticketSales', data.id)));
  });
}
test('no grants, anonymous access and unscoped collection queries remain denied', async () => {
  const data = sale(orgs[0], U.outsider);
  await assertFails(setDoc(doc(outsider, 'ticketSales', data.id), data));
  await assertFails(getDoc(doc(anonymous, 'ticketSales', data.id)));
  await assertFails(getDocs(collection(writer, 'ticketSales')));
  await assertSucceeds(getDocs(query(collection(writer, 'ticketSales'), where('organizationId', '==', orgs[0]))));
});
test('schema, immutable organization, required fields, revision and timestamp checks remain enforced', async () => {
  const data = sale(orgs[0]), ref = doc(writer, 'ticketSales', data.id);
  await assertFails(updateDoc(ref, { organizationId: orgs[1] }));
  await assertFails(updateDoc(ref, { quantity: -1 }));
  await assertFails(updateDoc(ref, { extraData: 'dns-test' }));
  await assertFails(updateDoc(ref, { updatedAt: new Date('2000-01-01') }));
  await assertFails(setDoc(ref, { id: data.id, organizationId: orgs[0] }));
  await assertFails(setDoc(doc(writer, 'users', U.writer), { active: true, globalRoles: ['dns-admin'] }));
  await assertFails(getDoc(doc(writer, 'users', U.admin)));
  await assertFails(setDoc(doc(writer, 'ticketSales', 'dns-test-orphan', 'revisions', '1'), data));
});
test('missing and inactive memberships deny; omitted Data Entry denies; absent policy preserves legacy grants', async () => {
  const policy = `organizationToolAccess/${orgs[0]}`, membership = `memberships/${U.writer}__${orgs[0]}`;
  const data = sale(orgs[0]);
  const change = async (path, value) => env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), path), value); });
  await change(membership, { userId: U.writer, organizationId: orgs[0], active: false });
  await assertFails(getDoc(doc(writer, 'ticketSales', data.id)));
  await env.withSecurityRulesDisabled(async c => { const { deleteDoc } = await import('firebase/firestore'); await deleteDoc(doc(c.firestore(), membership)); });
  await assertFails(getDoc(doc(writer, 'ticketSales', data.id)));
  await change(membership, { userId: U.writer, organizationId: orgs[0], active: true });
  await change(policy, { organizationId: orgs[0], tools: {} });
  await assertFails(getDoc(doc(writer, 'ticketSales', data.id)));
  await env.withSecurityRulesDisabled(async c => { const { deleteDoc } = await import('firebase/firestore'); await deleteDoc(doc(c.firestore(), policy)); });
  await assertSucceeds(getDoc(doc(writer, 'ticketSales', data.id)));
});
test('missing/inactive profiles cannot use a valid grant or self-assign administrator privileges', async () => {
  const missing = env.authenticatedContext('dns-test-missing-profile').firestore();
  const inactive = env.authenticatedContext('dns-test-inactive-profile').firestore();
  await env.withSecurityRulesDisabled(async c => {
    const db = c.firestore();
    await setDoc(doc(db, 'users', 'dns-test-inactive-profile'), { active: false, globalRoles: ['dns-admin'] });
    for (const uid of ['dns-test-missing-profile', 'dns-test-inactive-profile']) {
      await setDoc(doc(db, 'accessGrants', `${uid}__organization__${orgs[0]}`), { active: true, permissions: ['ticketSales.read', 'ticketSales.write'] });
      await setDoc(doc(db, 'memberships', `${uid}__${orgs[0]}`), { active: true });
    }
  });
  for (const [uid, db] of [['dns-test-missing-profile', missing], ['dns-test-inactive-profile', inactive]]) {
    const data = sale(orgs[0], uid);
    await assertFails(setDoc(doc(db, 'ticketSales', data.id), data));
    await assertFails(setDoc(doc(db, 'users', uid), { active: true, globalRoles: ['dns-admin'] }));
    await assertFails(getDoc(doc(db, 'ticketSales', data.id)));
  }
});

test('expired and future memberships cannot bypass an existing Data Entry policy', async () => {
  const path = `memberships/${U.writer}__${orgs[1]}`;
  const ref = doc(writer, 'ticketSales', sale(orgs[1]).id);
  const change = async member => env.withSecurityRulesDisabled(async c =>
    setDoc(doc(c.firestore(), path), { userId: U.writer, organizationId: orgs[1], active: true, ...member }));
  await change({ validTo: '2000-01-01T00:00:00Z' });
  await assertFails(getDoc(ref));
  await change({ validFrom: '2999-01-01T00:00:00Z' });
  await assertFails(getDoc(ref));
  await change({});
  await assertSucceeds(getDoc(ref));
});
