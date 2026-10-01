import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { AREA_ALLOCATION_KEYS } from '../src/area-allocation-keys.js';

const TARGET_PROJECT_ID = 'dns-core';
const APPLY = process.argv.includes('--apply');

function validate() {
  for (const key of AREA_ALLOCATION_KEYS) {
    const share = key.allocations.reduce((sum, row) => sum + row.share, 0);
    const fixedShare = key.allocations.reduce((sum, row) => sum + row.fixedShare, 0);
    if (Math.abs(share - 1) > 0.000001 || Math.abs(fixedShare - 1) > 0.000001) {
      throw new Error(`${key.id}: share and fixedShare must each sum to 1.0`);
    }
  }
}

async function main() {
  validate();
  if (!APPLY) {
    console.log(`Dry run: ${AREA_ALLOCATION_KEYS.length} allocation-key documents validated.`);
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId: TARGET_PROJECT_ID });
  const db = getFirestore();

  for (const key of AREA_ALLOCATION_KEYS) {
    await db.collection('areaAllocationKeys').doc(key.id).set({
      ...JSON.parse(JSON.stringify(key)),
      source: {
        type: 'dns-shared-data',
        repository: 'dolomitinordicski/dns-shared-data',
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  console.log(`✓ areaAllocationKeys: ${AREA_ALLOCATION_KEYS.length} documents written/merged.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
