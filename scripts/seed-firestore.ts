import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import {
  CANONICAL_DATASET_VERSION,
  CANONICAL_SCHEMA_VERSION,
  DESTINATIONS,
  ORGANIZATIONS,
  REPORTING_AREAS,
  SEASONS,
} from '../src/canonical-data.js';

const TARGET_PROJECT_ID = 'dns-core';
const APPLY = process.argv.includes('--apply');

type CanonicalRecord = {
  id: string;
  [key: string]: unknown;
};

type SeedCollection = {
  name: 'reportingAreas' | 'destinations' | 'organizations' | 'seasons';
  records: readonly CanonicalRecord[];
};

const collections: readonly SeedCollection[] = [
  { name: 'reportingAreas', records: REPORTING_AREAS },
  { name: 'destinations', records: DESTINATIONS },
  { name: 'organizations', records: ORGANIZATIONS },
  { name: 'seasons', records: SEASONS },
];

const totalDocuments = collections.reduce(
  (sum, collection) => sum + collection.records.length,
  0,
);

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function printPlan() {
  console.log('');
  console.log('DNS_Core — Firebase Master Dataset v0.1');
  console.log('---------------------------------------');
  console.log(`Target project: ${TARGET_PROJECT_ID}`);
  console.log(`Canonical dataset: v${CANONICAL_DATASET_VERSION}`);
  console.log(`Schema version: ${CANONICAL_SCHEMA_VERSION}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log('');

  for (const collection of collections) {
    console.log(
      `${collection.name.padEnd(16)} ${String(collection.records.length).padStart(3)} documents`,
    );
  }

  console.log('---------------------------------------');
  console.log(`Total             ${totalDocuments} documents`);
  console.log('');
}

async function seed() {
  printPlan();

  if (!APPLY) {
    console.log('No Firestore writes performed.');
    console.log('Run "npm run seed:firebase:apply" to write to DNS_Core.');
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

  for (const collection of collections) {
    console.log(`Seeding ${collection.name}...`);

    for (const record of collection.records) {
      const ref = db.collection(collection.name).doc(record.id);
      const existing = await ref.get();

      const payload: Record<string, unknown> = {
        ...plain(record),
        canonicalId: record.id,
        schemaVersion: CANONICAL_SCHEMA_VERSION,
        canonicalDatasetVersion: CANONICAL_DATASET_VERSION,
        source: {
          type: 'dns-shared-data',
          repository: 'dolomitinordicski/dns-shared-data',
        },
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!existing.exists) {
        payload.createdAt = FieldValue.serverTimestamp();
      }

      // Merge is intentional: canonical master updates must not erase
      // future operational fields owned by applications.
      await ref.set(payload, { merge: true });
    }

    console.log(`✓ ${collection.name}: ${collection.records.length}`);
  }

  console.log('');
  console.log(`✓ DNS_Core seed complete: ${totalDocuments} documents written/merged.`);
}

seed().catch((error) => {
  console.error('');
  console.error('Seed failed.');
  console.error(error);
  process.exitCode = 1;
});
