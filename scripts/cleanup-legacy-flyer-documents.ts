import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'dns-core';
const APPLY = process.argv.includes('--apply');
const EXPECTED = Number(process.env.EXPECTED_LEGACY_COUNT || '0');

async function main() {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();
  const snapshot = await db.collection('flyerDocuments').get();

  const canonical = snapshot.docs.filter(doc => doc.id.startsWith('current__'));
  const legacy = snapshot.docs.filter(doc => !doc.id.startsWith('current__'));

  console.log(`flyerDocuments total: ${snapshot.size}`);
  console.log(`canonical current__: ${canonical.length}`);
  console.log(`legacy candidates: ${legacy.length}`);

  if (legacy.length) {
    console.log('legacy ids:');
    for (const doc of legacy) console.log(`- ${doc.id}`);
  }

  if (!APPLY) {
    console.log('DRY RUN ONLY — no documents deleted.');
    return;
  }

  if (!EXPECTED || legacy.length !== EXPECTED) {
    throw new Error(
      `Safety guard: expected ${EXPECTED || 'a non-zero EXPECTED_LEGACY_COUNT'} legacy documents, found ${legacy.length}. No deletion performed.`,
    );
  }

  if (canonical.length === 0) {
    throw new Error('Safety guard: no canonical current__ documents found. No deletion performed.');
  }

  let deleted = 0;
  for (let i = 0; i < legacy.length; i += 400) {
    const batch = db.batch();
    for (const docSnap of legacy.slice(i, i + 400)) batch.delete(docSnap.ref);
    await batch.commit();
    deleted += Math.min(400, legacy.length - i);
  }

  const after = await db.collection('flyerDocuments').get();
  const remainingLegacy = after.docs.filter(doc => !doc.id.startsWith('current__'));

  if (remainingLegacy.length !== 0) {
    throw new Error(`Cleanup verification failed: ${remainingLegacy.length} legacy documents remain.`);
  }

  console.log(`✓ deleted ${deleted} legacy flyerDocuments; preserved ${after.size} canonical current__ documents.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
