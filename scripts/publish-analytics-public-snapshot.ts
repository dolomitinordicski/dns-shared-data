import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import {
  ANALYTICS_PUBLIC_SCHEMA_VERSION,
  type AnalyticsLegacyBaseline,
  type AnalyticsPublicSnapshot,
} from '../src/analytics-public.js';

const TARGET_PROJECT_ID = 'dns-core';
const SEASON_ID = '2025-26';
const APPLY = process.argv.includes('--apply');
const AUDIT_ID = 'legacy-dashboard-v1' as const;
const EXPECTED_SHA256 =
  '30b10ebd49f8bf32b5f2f0e02bc068efebaa940aa73428c910ff52e218dd3e88';

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return '{' + Object.keys(record).sort()
      .map((key) => JSON.stringify(key) + ':' + canonicalJson(record[key]))
      .join(',') + '}';
  }
  return JSON.stringify(value);
}

async function buildSnapshot(db: ReturnType<typeof getFirestore>): Promise<AnalyticsPublicSnapshot> {
  const audit = JSON.parse(
    await readFile(new URL('./analytics-audit-snapshot.json', import.meta.url), 'utf8'),
  ) as Record<string, unknown>;

  const source = audit.source as Record<string, unknown> | undefined;
  if (audit.id !== AUDIT_ID || audit.schemaVersion !== 1) {
    throw new Error('Unexpected Analytics audit snapshot identity.');
  }
  if (source?.sha256 !== EXPECTED_SHA256) {
    throw new Error('Analytics audit snapshot source fingerprint mismatch.');
  }

  const baseline: AnalyticsLegacyBaseline = {
    labels: audit.labels as AnalyticsLegacyBaseline['labels'],
    seasonOverview: audit.seasonOverview as Record<string, unknown>,
    annual: audit.annual as Record<string, unknown>,
    regional: audit.regional as Record<string, unknown>,
    kpRegions: audit.kpRegions as Array<Record<string, unknown>>,
    kpPartners: audit.kpPartners as Array<Record<string, unknown>>,
    advancedDefaults: audit.advancedDefaults as Record<string, unknown>,
    overnightAreas: audit.overnightAreas as Array<Record<string, unknown>>,
    intensityAreas: audit.intensityAreas as Array<Record<string, unknown>>,
  };

  const fairDoc = await db.collection('fairModel').doc('ws-2026-27').get();
  const fairData = fairDoc.exists ? fairDoc.data() ?? {} : {};
  const fairRegions = Array.isArray(fairData.regions) ? fairData.regions : undefined;

  return {
    id: SEASON_ID,
    seasonId: SEASON_ID,
    schemaVersion: ANALYTICS_PUBLIC_SCHEMA_VERSION,
    revision: 1,
    publicationStatus: 'published',
    generatedAt: new Date().toISOString(),
    source: {
      auditSnapshotId: AUDIT_ID,
      auditSourceSha256: EXPECTED_SHA256,
      analyticsCommitBaseline: String(source?.analyticsCommitBaseline ?? ''),
    },
    baseline,
    ...(fairRegions
      ? {
          fair: {
            sourceDocument: 'fairModel/ws-2026-27',
            clientUpdatedAt:
              typeof fairData.clientUpdatedAt === 'number'
                ? fairData.clientUpdatedAt
                : undefined,
            regions: fairRegions as Array<Record<string, unknown>>,
          },
        }
      : {}),
  };
}

async function main() {
  initializeApp({ credential: applicationDefault(), projectId: TARGET_PROJECT_ID });
  const db = getFirestore();
  const snapshot = await buildSnapshot(db);

  if (!APPLY) {
    console.log(
      `Validated analyticsPublicSnapshots/${snapshot.id} against ${snapshot.source.auditSourceSha256}`,
    );
    return;
  }

  const ref = db.collection('analyticsPublicSnapshots').doc(snapshot.id);
  const current = await ref.get();
  const nextRevision = current.exists ? Number(current.data()?.revision ?? 0) + 1 : 1;
  const publication = { ...snapshot, revision: nextRevision };

  await ref.set(publication, { merge: false });

  const readBack = await ref.get();
  if (!readBack.exists) throw new Error('Analytics public snapshot read-back failed.');
  const actual = readBack.data();
  if (!actual) throw new Error('Analytics public snapshot read-back payload missing.');

  if (canonicalJson(actual) !== canonicalJson(publication)) {
    throw new Error('Analytics public snapshot read-back differs from publication payload.');
  }

  const persistedBaseline = (actual as Record<string, unknown>).baseline;
  if (canonicalJson(persistedBaseline) !== canonicalJson(snapshot.baseline)) {
    throw new Error('Analytics baseline changed during publication.');
  }

  console.log(
    `✓ analyticsPublicSnapshots/${publication.id} · revision ${publication.revision} · exact zero-loss read-back verified`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
