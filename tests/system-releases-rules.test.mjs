import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, query, where, setDoc, updateDoc } from 'firebase/firestore';
import fs from 'node:fs';
const env = await initializeTestEnvironment({
  projectId: 'demo-dns-core',
  firestore: { host: '127.0.0.1', port: 8088, rules: fs.readFileSync('firestore.rules', 'utf8') },
});
try {
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    for (const [id, active, roles] of [['admin', true, ['dns-admin']], ['area', true, []], ['inactive', false, ['dns-admin']]]) {
      await setDoc(doc(db, 'users', id), { active, globalRoles: roles });
    }
    for (const [id, audience, type, published] of [
      ['feature-area', 'area', 'feature', true],
      ['urgent-area', 'area', 'urgent', true],
      ['technical-dns', 'dns', 'technical', true],
      ['technical-area', 'area', 'technical', true],
      ['draft-area', 'area', 'feature', false],
      ['feature-dns', 'dns', 'feature', true],
    ]) {
      await setDoc(doc(db, 'systemReleases', id), { audience, type, published, toolId: 'workspace', version: '1.0', publishedAt: '2026-10-30' });
    }
  });
  const admin = env.authenticatedContext('admin').firestore();
  const area = env.authenticatedContext('area').firestore();
  const inactive = env.authenticatedContext('inactive').firestore();
  const anonymous = env.unauthenticatedContext().firestore();
  for (const id of ['feature-area', 'urgent-area', 'technical-dns', 'technical-area', 'feature-dns']) {
    await assertSucceeds(getDoc(doc(admin, 'systemReleases', id)));
  }
  await assertSucceeds(getDoc(doc(area, 'systemReleases', 'feature-area')));
  await assertSucceeds(getDoc(doc(area, 'systemReleases', 'urgent-area')));
  for (const id of ['technical-dns', 'technical-area', 'feature-dns', 'draft-area']) {
    await assertFails(getDoc(doc(area, 'systemReleases', id)));
  }
  await assertFails(getDoc(doc(admin, 'systemReleases', 'draft-area')));
  await assertFails(getDoc(doc(inactive, 'systemReleases', 'feature-area')));
  await assertFails(getDoc(doc(anonymous, 'systemReleases', 'feature-area')));
  await assertFails(setDoc(doc(admin, 'systemReleases', 'new'), { audience: 'dns', published: true }));
  await assertFails(updateDoc(doc(admin, 'systemReleases', 'feature-area'), { version: '2.0' }));
  const areaQuery = query(collection(area, 'systemReleases'), where('published', '==', true), where('audience', '==', 'area'), where('type', 'in', ['feature', 'urgent']));
  const areaRows = await assertSucceeds(getDocs(areaQuery));
  if (areaRows.size !== 2) throw new Error('Area query leaked records');
  for (const audience of ['dns', 'area']) {
    const adminQuery = query(collection(admin, 'systemReleases'),
      where('published', '==', true),
      where('audience', '==', audience),
      where('type', 'in', ['technical', 'feature', 'urgent']));
    const rows = await assertSucceeds(getDocs(adminQuery));
    if (rows.size !== (audience === 'dns' ? 2 : 3)) {
      throw new Error('Admin query returned unexpected records for ' + audience);
    }
  }
  await assertFails(getDocs(collection(area, 'systemReleases')));
  console.log('systemReleases Firestore rules passed');
} finally {
  await env.cleanup();
}
