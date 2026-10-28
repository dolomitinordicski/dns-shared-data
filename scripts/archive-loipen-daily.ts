import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import { DNS_LOIPEN_REGION_IDS } from '../src/loipen-html-adapter.js';
import { aggregateDNSCarouselCounters } from '../src/widget-carousel-aggregation.js';

const file = process.argv.find(arg => arg.endsWith('.json'));
const apply = process.argv.includes('--apply');
if (!file) throw new Error('Provide inspection report JSON');
const data = JSON.parse(await readFile(file, 'utf8'));
if (data.status !== 'inspection-only' || data.source !== 'dns-website-regional-loipen' ||
    data.sourceObservedAt !== null || !Array.isArray(data.areas)) {
  throw new Error('Unexpected Loipen inspection report');
}
const totals = aggregateDNSCarouselCounters(data.areas);
if (JSON.stringify(totals) !== JSON.stringify(data.totals)) throw new Error('Tampered aggregate');
const acquired = new Date(data.collectedAt);
if (!Number.isFinite(acquired.valueOf()) || Math.abs(Date.now() - acquired.valueOf()) > 90 * 60 * 1000) {
  throw new Error('Inspection must be fresh (90 minute limit)');
}
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome',
  year: 'numeric', month: '2-digit', day: '2-digit' }).format(acquired);
if (date < '2026-10-29') throw new Error('History starts on 2026-10-29');
const seasonId = '2026-27';
const entries = [...data.areas.map((a: any) => ({
  areaId: a.areaId, openKm: a.openKm, totalKm: a.totalKm,
  openTrails: a.openTrails, totalTrails: a.totalTrails,
  sourceRegionId: a.sourceRegionId
})), { areaId: 'all', ...totals }];
for (const entry of entries) {
  if (!Number.isFinite(entry.openKm) || entry.openKm < 0 || entry.openKm > entry.totalKm) {
    throw new Error('Invalid daily opening kilometre value');
  }
}
if (!apply) {
  console.log(JSON.stringify({ operation: 'dry-run', date, seasonId, documents: entries.length, totals }, null, 2));
} else {
  if (process.env.GOOGLE_CLOUD_PROJECT !== 'dns-core') throw new Error('dns-core project required');
  initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
  const db = getFirestore();
  // Document per day and area: create only. A later run must not silently overwrite history.
  for (const entry of entries) {
    const documentId = seasonId + '__' + entry.areaId + '__' + date;
    const ref = db.collection('loipenDailySnapshots').doc(documentId);
    const record = {
      schemaVersion: 1, documentId, seasonId, areaId: entry.areaId, date,
      ...entry, source: 'dns-website-regional-loipen', collectedAt: acquired.toISOString(),
      sourceObservedAt: null, verification: 'website-counter-captured',
      publicationStatus: 'internal-history', createdAt: new Date().toISOString()
    };
    try {
      await ref.create(record);
      console.log('Created ' + documentId);
    } catch (error: any) {
      // An already-created day cannot be overwritten, including when a later site refresh changes.
      if (error?.code === 6 || String(error).includes('ALREADY_EXISTS')) {
        const prior = await ref.get();
        const previous = prior.data();
        if (!prior.exists || ['openKm','totalKm','openTrails','totalTrails'].some(k => previous?.[k] !== (record as any)[k])) {
          throw new Error('Historical value already exists and differs: ' + documentId);
        }
        console.log('Existing identical data ' + documentId);
      } else throw error;
    }
  }
}
