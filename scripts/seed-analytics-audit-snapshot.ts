import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { ANALYTICS_LEGACY_AUDIT_SNAPSHOT } from '../src/analytics-audit-snapshot.js';

const TARGET_PROJECT_ID = 'dns-core';
const APPLY = process.argv.includes('--apply');

async function main() {
  if (!APPLY) {
    console.log('Dry run only: analyticsAuditSnapshots/legacy-dashboard-v1');
    return;
  }
  initializeApp({ credential: applicationDefault(), projectId: TARGET_PROJECT_ID });
  const db=getFirestore();
  await db.collection('analyticsAuditSnapshots').doc(ANALYTICS_LEGACY_AUDIT_SNAPSHOT.id).set({
    ...JSON.parse(JSON.stringify(ANALYTICS_LEGACY_AUDIT_SNAPSHOT)),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: false });
  console.log('✓ analyticsAuditSnapshots/legacy-dashboard-v1');
}

main().catch((error)=>{ console.error(error); process.exitCode=1; });
