import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';

const TARGET_PROJECT_ID = 'dns-core';
const APPLY = process.argv.includes('--apply');

async function main() {
  const snapshot = JSON.parse(
    await readFile(new URL('./analytics-audit-snapshot.json', import.meta.url), 'utf8'),
  );

  if (snapshot.id !== 'legacy-dashboard-v1' || snapshot.schemaVersion !== 1) {
    throw new Error('Invalid Analytics audit snapshot.');
  }
  if (
    snapshot.source?.sha256 !==
    '30b10ebd49f8bf32b5f2f0e02bc068efebaa940aa73428c910ff52e218dd3e88'
  ) {
    throw new Error('Analytics audit source fingerprint mismatch.');
  }

  if (!APPLY) {
    console.log('Validated analyticsAuditSnapshots/legacy-dashboard-v1 (dry run).');
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId: TARGET_PROJECT_ID });
  const db = getFirestore();
  const ref = db.collection('analyticsAuditSnapshots').doc(snapshot.id);

  await ref.set(
    {
      ...snapshot,
      source: {
        ...snapshot.source,
        purpose: 'Zero-loss audit copy. Not an operational source until exact parity gates pass.',
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: false },
  );

  const persisted = await ref.get();
  if (!persisted.exists) throw new Error('Analytics audit snapshot read-back failed.');

  const data = persisted.data();
  const comparable = { ...data };
  delete comparable.updatedAt;
  const expected = {
    ...snapshot,
    source: {
      ...snapshot.source,
      purpose: 'Zero-loss audit copy. Not an operational source until exact parity gates pass.',
    },
  };
  const normalize = (value) =>
    Array.isArray(value)
      ? value.map(normalize)
      : value && typeof value === 'object'
        ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]))
        : value;

  if (JSON.stringify(normalize(comparable)) !== JSON.stringify(normalize(expected))) {
    throw new Error('Analytics audit snapshot read-back differs from golden master.');
  }

  console.log('✓ analyticsAuditSnapshots/legacy-dashboard-v1 · exact read-back verified');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
