import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import {
  DNS_DESIGN_SYSTEM,
  DNS_DESIGN_SYSTEM_VERSION,
} from '../src/design-system.js';

const TARGET_PROJECT_ID = 'dns-core';
const APPLY = process.argv.includes('--apply');

async function seed() {
  console.log('');
  console.log('DNS_Core — DNS Design System');
  console.log('----------------------------');
  console.log(`Target project: ${TARGET_PROJECT_ID}`);
  console.log(`Version: ${DNS_DESIGN_SYSTEM_VERSION}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log('');

  if (!APPLY) {
    console.log('No Firestore writes performed.');
    console.log('Run "npm run seed:design-system:apply" to publish v1 + current.');
    return;
  }

  const explicitProject =
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID;

  if (explicitProject && explicitProject !== TARGET_PROJECT_ID) {
    throw new Error(
      `Refusing to seed project "${explicitProject}". Expected "${TARGET_PROJECT_ID}".`,
    );
  }

  initializeApp({
    credential: applicationDefault(),
    projectId: TARGET_PROJECT_ID,
  });

  const db = getFirestore();
  const now = FieldValue.serverTimestamp();

  const payload = {
    ...DNS_DESIGN_SYSTEM,
    schemaVersion: 1,
    source: {
      type: 'dns-shared-data',
      repository: 'dolomitinordicski/dns-shared-data',
      brandColorReference: 'DNS Partner Portal',
      interactionReference: 'Dolomiti NordicSki public website',
      dataUiReference: 'DNS Analytics',
    },
    updatedAt: now,
  };

  await db.collection('designSystem').doc('v1').set(payload, { merge: true });
  await db.collection('designSystem').doc('current').set(
    {
      ...payload,
      id: 'current',
      resolvedVersionId: 'v1',
    },
    { merge: true },
  );

  console.log('✓ designSystem/v1');
  console.log('✓ designSystem/current');
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
