import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { REPORTING_AREAS } from '../src/canonical-data.js';
import { isDNSPublicWidgetSnapshot, type DNSPublicWidgetSnapshot } from '../src/public-widget.js';
import { mergeApprovedWidgetTrails } from '../src/widget-trails-snapshot-merge.js';

const apply = process.argv.includes('--apply');
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome',
  year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
if (date < '2026-10-29') throw new Error('Publication starts on 2026-10-29');
if (process.env.GOOGLE_CLOUD_PROJECT !== 'dns-core') throw new Error('Explicit dns-core project required');
initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
const db = getFirestore();
const seasonId = '2026-27';
const ids = [...REPORTING_AREAS.filter(a => a.active).map(a => a.id), 'all'];
if (ids.length !== 9) throw new Error('Expected eight DNS areas plus network');
const records = await Promise.all(ids.map(async areaId => {
  const documentId = seasonId + '__' + areaId + '__' + date;
  const snap = await db.collection('loipenDailySnapshots').doc(documentId).get();
  if (!snap.exists) throw new Error('Missing historical record: ' + documentId);
  const d = snap.data()!;
  if (d.verification !== 'website-counter-captured' || d.publicationStatus !== 'internal-history' ||
      d.areaId !== areaId || d.seasonId !== seasonId || d.date !== date ||
      !Number.isFinite(d.openKm) || !Number.isFinite(d.totalKm) ||
      d.openKm < 0 || d.totalKm < d.openKm || !Number.isFinite(Date.parse(d.collectedAt))) {
    throw new Error('Invalid historical record: ' + documentId);
  }
  if (Date.now() - Date.parse(d.collectedAt) > 6 * 3600_000 ||
      Date.parse(d.collectedAt) - Date.now() > 60_000) throw new Error('Stale acquisition: ' + documentId);
  return { areaId, d };
}));
const regions = records.filter(r => r.areaId !== 'all');
const total = records.find(r => r.areaId === 'all')!.d;
for (const field of ['openKm', 'totalKm']) {
  const sum = regions.reduce((n,r) => n + r.d[field], 0);
  if (sum !== total[field]) throw new Error('Network mismatch: ' + field);
}
if (!apply) {
  console.log(JSON.stringify({ operation: 'dry-run', seasonId, date,
    count: records.length, network: { openKm: total.openKm, totalKm: total.totalKm } }));
  process.exit(0);
}
for (const { areaId, d } of records) {
  const documentId = seasonId + '__' + areaId;
  const ref = db.collection('widgetPublicSnapshots').doc(documentId);
  await db.runTransaction(async tx => {
    const old = await tx.get(ref);
    const existing = old.data()?.snapshot;
    if (old.exists && (old.data()?.publicationStatus !== 'published' ||
        !isDNSPublicWidgetSnapshot(existing))) throw new Error('Unapproved existing snapshot: ' + documentId);
    // ObservedAt here is precisely when DNS website counters were captured,
    // not an inferred timestamp of an underlying piste sensor.
    const observedAt = d.collectedAt as string;
    const publishedAt = new Date().toISOString();
    const trails: DNSPublicWidgetSnapshot['trails'] = {
      status: 'available', observedAt, openKm: d.openKm, totalKm: d.totalKm
    };
    const revision = 'loipen-' + date + '-' + observedAt.replace(/[^0-9]/g, '');
    let snapshot: DNSPublicWidgetSnapshot;
    if (existing) {
      if (existing.trails?.observedAt && Date.parse(existing.trails.observedAt) >= Date.parse(observedAt)) {
        console.log('Already current: ' + documentId);
        return;
      }
      snapshot = mergeApprovedWidgetTrails(existing, trails, { areaId: areaId === 'all' ? null as any : areaId,
        seasonId, revision, publishedAt });
    } else {
      const area = REPORTING_AREAS.find(a => a.id === areaId);
      snapshot = { schemaVersion: 1, revision, publishedAt, seasonId: seasonId as DNSPublicWidgetSnapshot['seasonId'],
        areaId: area?.id ?? null,
        areaName: area?.localizedName ?? { de: 'Dolomiti NordicSki', it: 'Dolomiti NordicSki', en: 'Dolomiti NordicSki' },
        logo: null,
        pricing: { status: 'unavailable', updatedAt: null, items: [] },
        weather: { status: 'unavailable', observedAt: null, temperatureC: null, snowDepthCm: null },
        trails };
    }
    tx.set(ref, { documentId, publicationStatus: 'published', snapshot });
  });
  const check = await ref.get();
  if (check.data()?.snapshot?.trails?.observedAt !== d.collectedAt) {
    throw new Error('Widget publication readback mismatch: ' + documentId);
  }
  console.log('Published validated trails: ' + documentId);
}
