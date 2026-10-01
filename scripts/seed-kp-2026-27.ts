import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { KP_MILESTONES_2026_27, KP_SETUP_SEASON_ID } from '../src/kp-setup-2026-27.js';

const APPLY = process.argv.includes('--apply');
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? 'dns-core';

async function main() {
  console.log('DNS_Core — 2026-27 KP Setup');
  console.log('---------------------------');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Milestones: ${KP_MILESTONES_2026_27.map((item) => item.date).join(' · ')}`);

  if (!APPLY) return;

  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();
  const batch = db.batch();

  for (const milestone of KP_MILESTONES_2026_27) {
    batch.set(db.collection('kpMilestones').doc(milestone.id), milestone, { merge: true });
  }

  batch.set(db.collection('kpSetupImports').doc(KP_SETUP_SEASON_ID), {
    seasonId: KP_SETUP_SEASON_ID,
    milestoneIds: KP_MILESTONES_2026_27.map((item) => item.id),
    configuredAt: new Date().toISOString(),
  }, { merge: true });

  await batch.commit();
  console.log('✓ KP milestones configured');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
