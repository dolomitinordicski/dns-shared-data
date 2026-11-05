import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, documentId, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-dns-core',
  firestore: { host: '127.0.0.1', port: 8088, rules: await readFile('firestore.rules', 'utf8') },
});
const areaId = 'drei-zinnen';
const otherId = 'gsiesertal-welsberg-taisten';
const flyerId = `current__reportingArea__${areaId}__2026-27__regional_price_list`;
const missingId = `current__reportingArea__${areaId}__2026-27__dns_price_list`;
const db = uid => env.authenticatedContext(uid).firestore();

try {
  await env.withSecurityRulesDisabled(async context => {
    const root = context.firestore();
    for (const uid of ['areaWriter', 'areaColleague', 'otherArea']) {
      await setDoc(doc(root, 'users', uid), { active: true, globalRoles: [] });
      const scope = uid === 'otherArea' ? otherId : areaId;
      await setDoc(doc(root, 'accessGrants', `${uid}__reportingArea__${scope}`), {
        active: true, scopeType: 'reportingArea', scopeId: scope,
        permissions: ['flyer.read', 'flyer.write'],
      });
    }
    for (const area of [areaId, otherId])
      await setDoc(doc(root, 'reportingAreas', area), { active: true });
    await setDoc(doc(root, 'seasons', '2026-27'), { status: 'active' });
  });
  const draft = {
    id: flyerId, schema: 'dns.flyer-document', version: 1,
    title: 'Regional', scopeType: 'reportingArea', scopeId: areaId,
    seasonId: '2026-27', status: 'draft', ownerUserId: 'areaWriter',
    updatedBy: 'areaWriter', updatedAt: serverTimestamp(),
    document: { schema: 'dns.flyer-document', version: 1 },
  };
  await assertSucceeds(setDoc(doc(db('areaWriter'), 'flyerDocuments', flyerId), draft));
  const scoped = (uid, id) => getDocs(query(
    collection(db(uid), 'flyerDocuments'),
    where('scopeType', '==', 'reportingArea'),
    where('scopeId', '==', areaId),
    where(documentId(), '==', id),
  ));
  console.log('CHECK 1: existing scoped query');
  const existing = await assertSucceeds(scoped('areaColleague', flyerId));
  assert.equal(existing.docs.length, 1);
  assert.equal(existing.docs[0].id, flyerId);
  console.log('CHECK 2: missing scoped query');
  const missing = await assertSucceeds(scoped('areaColleague', missingId));
  assert.equal(missing.empty, true);
  console.log('CHECK 3: other-area existing denied');
  await assertFails(scoped('otherArea', flyerId));
  await assertFails(scoped('otherArea', missingId));
  await assertFails(getDoc(doc(db('otherArea'), 'flyerDocuments', flyerId)));
  await assertFails(getDoc(doc(db('areaWriter'), 'flyerDocuments', missingId)));
  console.log('PASS: scoped query distinguishes absent Flyer from denial without widening rules');
} finally {
  await env.cleanup();
}
