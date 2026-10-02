import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { IDM_PREMIUM_PROGRAMS } from '../src/idm-premium-programs.js';

const TARGET_PROJECT_ID = 'dns-core';
const APPLY = process.argv.includes('--apply');

function validate() {
  for (const program of IDM_PREMIUM_PROGRAMS) {
    if (!program.id || !program.seasonId) throw new Error('IDM program id/season required');
    if (!Number.isFinite(program.amountPerReportingArea) || program.amountPerReportingArea < 0) {
      throw new Error(`${program.id}: invalid amountPerReportingArea`);
    }
    if (!program.reportingAreaIds.length) {
      throw new Error(`${program.id}: at least one reporting area required`);
    }
    if (new Set(program.reportingAreaIds).size !== program.reportingAreaIds.length) {
      throw new Error(`${program.id}: duplicate reportingAreaId`);
    }
    if (!Number.isInteger(program.revision) || program.revision < 1) {
      throw new Error(`${program.id}: invalid revision`);
    }
  }
}

async function main() {
  validate();
  if (!APPLY) {
    console.log(`Dry run: ${IDM_PREMIUM_PROGRAMS.length} IDM Premium program document(s) validated.`);
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId: TARGET_PROJECT_ID });
  const db = getFirestore();

  for (const program of IDM_PREMIUM_PROGRAMS) {
    await db.collection('idmPremiumPrograms').doc(program.id).set({
      ...JSON.parse(JSON.stringify(program)),
      source: {
        type: 'dns-shared-data',
        repository: 'dolomitinordicski/dns-shared-data',
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  console.log(`✓ idmPremiumPrograms: ${IDM_PREMIUM_PROGRAMS.length} document(s) written/merged.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
