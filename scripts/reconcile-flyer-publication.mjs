import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export function needsPublication(id, grant, user, area, now = new Date()) {
  if (!grant || grant.active !== true || user?.active !== true || area?.active !== true
      || grant.scopeType !== 'reportingArea' || typeof grant.scopeId !== 'string'
      || typeof grant.userId !== 'string'
      || id !== grant.userId + '__reportingArea__' + grant.scopeId
      || !Array.isArray(grant.permissions)
      || !grant.permissions.includes('flyer.read') || !grant.permissions.includes('flyer.write')
      || grant.permissions.includes('flyer.publish')) return false;
  for (const key of ['validFrom', 'validTo']) {
    if (grant[key] !== undefined) {
      if (typeof grant[key] !== 'string' || !Number.isFinite(Date.parse(grant[key]))) return false;
      if (key === 'validFrom' && now < new Date(grant[key])) return false;
      if (key === 'validTo' && now > new Date(grant[key])) return false;
    }
  }
  return true;
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (apply) assert.equal(process.env.RELEASE_AUTHORIZATION, 'AUTORIZZO DEPLOY PR #259');
  const { initializeApp, applicationDefault } = await import('firebase-admin/app');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
  const db = getFirestore();
  const grants = await db.collection('accessGrants').where('scopeType', '==', 'reportingArea').get();
  let eligible = 0, changed = 0;
  for (const document of grants.docs) {
    await db.runTransaction(async tx => {
      const current = await tx.get(document.ref);
      const grant = current.data();
      if (!grant || typeof grant.userId !== 'string' || typeof grant.scopeId !== 'string'
          || grant.userId.includes('/') || grant.scopeId.includes('/')) return;
      const [user, area] = await tx.getAll(db.doc('users/' + grant.userId), db.doc('reportingAreas/' + grant.scopeId));
      if (!needsPublication(current.id, grant, user.data(), area.data())) return;
      if (apply) tx.update(current.ref, { permissions: FieldValue.arrayUnion('flyer.publish') });
      // Counts are advisory under retries; persisted fields, user/area and other permissions are unchanged.
      eligible++;
    });
  }
  if (apply) {
    const fresh = await db.collection('accessGrants').where('scopeType', '==', 'reportingArea').get();
    changed = fresh.docs.filter(d => d.data().permissions?.includes('flyer.publish')).length;
  }
  console.log(JSON.stringify({ project: 'dns-core', mode: apply ? 'APPLY' : 'DRY_RUN', eligibleObservations: eligible,
    areaGrantsWithPublicationAfterApply: apply ? changed : null }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
