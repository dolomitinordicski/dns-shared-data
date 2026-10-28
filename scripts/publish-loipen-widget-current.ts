import { readFile } from 'node:fs/promises';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { REPORTING_AREAS } from '../src/canonical-data.js';
import { DNS_LOIPEN_REGION_IDS } from '../src/loipen-html-adapter.js';
import { aggregateDNSCarouselCounters } from '../src/widget-carousel-aggregation.js';
import { isDNSPublicWidgetSnapshot, type DNSPublicWidgetSnapshot } from '../src/public-widget.js';
import { mergeApprovedWidgetTrails } from '../src/widget-trails-snapshot-merge.js';

const file = process.argv.find(arg => arg.endsWith('.json'));
const apply = process.argv.includes('--apply');
if (!file) throw new Error('Provide current Loipen inspection JSON');
const report = JSON.parse(await readFile(file, 'utf8'));
if (report.status !== 'inspection-only' || report.source !== 'dns-website-regional-loipen' ||
    report.sourceObservedAt !== null || report.publicationApproved !== false ||
    !Array.isArray(report.areas) || report.areas.length !== 8) {
  throw new Error('Unexpected source inspection report');
}
const captured = Date.parse(report.collectedAt);
if (!Number.isFinite(captured) || captured > Date.now() + 60_000 ||
    Date.now() - captured > 90 * 60_000) throw new Error('Stale current source inspection');
const areaIds = REPORTING_AREAS.filter(a => a.active).map(a => a.id);
if (areaIds.length !== 8 || new Set(report.areas.map((a: any) => a.areaId)).size !== 8 ||
    !areaIds.every(id => report.areas.some((a: any) => a.areaId === id)) ||
    new Set(report.areas.map((a: any) => a.sourceRegionId)).size !== 8 ||
    !report.areas.every((a: any) => Number.isInteger(a.sourceRegionId) &&
      DNS_LOIPEN_REGION_IDS[a.sourceRegionId as keyof typeof DNS_LOIPEN_REGION_IDS] === a.areaId)) {
  throw new Error('Invalid or duplicated DNS region mapping');
}
const values = [...report.areas, { areaId: 'all', ...aggregateDNSCarouselCounters(report.areas) }];
const network = values[8];
if (JSON.stringify(report.totals) !== JSON.stringify(aggregateDNSCarouselCounters(report.areas))) {
  throw new Error('Network totals do not match regional counters');
}
for (const d of values) {
  if (![d.openKm, d.totalKm, d.openTrails, d.totalTrails].every(Number.isFinite) ||
    d.openKm < 0 || d.totalKm < d.openKm || d.openTrails < 0 || d.totalTrails < d.openTrails) {
    throw new Error('Invalid source trail counters: ' + d.areaId);
  }
}
console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', capturedAt: report.collectedAt,
  documents: values.length, totals: { openKm: network.openKm, totalKm: network.totalKm } }));
if (!apply) process.exit(0);
if (process.env.GOOGLE_CLOUD_PROJECT !== 'dns-core') throw new Error('Explicit dns-core project required');
initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
const db = getFirestore();
const seasonId = '2026-27';
for (const d of values) {
  const area = REPORTING_AREAS.find(a => a.id === d.areaId);
  const areaId = area?.id ?? null;
  const documentId = seasonId + '__' + d.areaId;
  const ref = db.collection('widgetPublicSnapshots').doc(documentId);
  const publishedAt = new Date().toISOString();
  const revision = 'loipen-current-' + report.collectedAt.replace(/[^0-9]/g, '');
  await db.runTransaction(async tx => {
    const previous = await tx.get(ref);
    const existing = previous.data()?.snapshot;
    if (previous.exists && (previous.data()?.publicationStatus !== 'published' ||
        !isDNSPublicWidgetSnapshot(existing))) throw new Error('Unapproved widget snapshot: ' + documentId);
    if (existing?.trails?.observedAt && Date.parse(existing.trails.observedAt) >= captured) {
      console.log('Already current: ' + documentId);
      return;
    }
    const trails: DNSPublicWidgetSnapshot['trails'] = {
      status: 'available', observedAt: report.collectedAt,
      openKm: d.openKm, totalKm: d.totalKm
    };
    let snapshot: DNSPublicWidgetSnapshot;
    if (existing) {
      snapshot = mergeApprovedWidgetTrails(existing, trails,
        { areaId: areaId as any, seasonId, revision, publishedAt });
    } else {
      snapshot = {
        schemaVersion: 1, revision, publishedAt,
        seasonId: seasonId as DNSPublicWidgetSnapshot['seasonId'], areaId,
        areaName: area?.localizedName ?? {
          de: 'Dolomiti NordicSki', it: 'Dolomiti NordicSki', en: 'Dolomiti NordicSki'
        },
        logo: null,
        pricing: { status: 'unavailable', updatedAt: null, items: [] },
        weather: { status: 'unavailable', observedAt: null, temperatureC: null, snowDepthCm: null },
        trails
      };
    }
    tx.set(ref, { documentId, publicationStatus: 'published', snapshot });
  });
  const saved = await ref.get();
  if (saved.data()?.snapshot?.trails?.observedAt !== report.collectedAt) {
    throw new Error('Widget current readback failed: ' + documentId);
  }
  console.log('Widget current checked: ' + documentId);
}
