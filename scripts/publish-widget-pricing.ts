import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { REPORTING_AREAS } from '../src/canonical-data.js';
import { isDNSPublicWidgetSnapshot } from '../src/public-widget.js';
import { selectPublishedWidgetPrices } from '../src/widget-public-pricing.js';
import type { TicketPricingConfig } from '../src/seasonal-operational-data.js';

const apply = process.argv.includes('--apply');
const seasonId = '2026-27';
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome',
  year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
if (process.env.GOOGLE_CLOUD_PROJECT !== 'dns-core') throw new Error('Explicit dns-core project required');
if (apply && process.env.DNS_WIDGET_PRICING_APPROVED !== 'true')
  throw new Error('Explicit DNS_WIDGET_PRICING_APPROVED=true required for production writes');
initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
const db = getFirestore();
const source = await db.collection('ticketPricingConfigs').where('seasonId', '==', seasonId).get();
const rows = source.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketPricingConfig));
const areas = [null, ...REPORTING_AREAS.filter(a => a.active).map(a => a.id)];
const plans = [];
const conflicts: { documentId: string; reason: string }[] = [];
for (const areaId of areas) {
  const id = seasonId + '__' + (areaId ?? 'all');
  const ref = db.collection('widgetPublicSnapshots').doc(id);
  const current = await ref.get();
  if (!current.exists || current.data()?.publicationStatus !== 'published' ||
      current.data()?.documentId !== id || !isDNSPublicWidgetSnapshot(current.data()?.snapshot))
    throw new Error('Expected previously published widget snapshot: ' + id);
  const snapshot = current.data()!.snapshot;
  if (snapshot.seasonId !== seasonId || snapshot.areaId !== areaId)
    throw new Error('Existing public widget scope mismatch: ' + id);
  let pricing;
  try {
    pricing = selectPublishedWidgetPrices(rows, seasonId, areaId, date);
  } catch (error) {
    conflicts.push({ documentId: id, reason: error instanceof Error ? error.message : String(error) });
    continue;
  }
  if (!pricing.items.length) {
    console.log(JSON.stringify({ id, result: 'no-public-official-prices', write: false }));
    continue; // Never overwrite previously published prices with an empty response.
  }
  plans.push({ id, ref, areaId, pricing });
}
console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', date, seasonId,
  sourceRows: rows.length, snapshotsWithPrices: plans.length,
  conflicts, plans: plans.map(p => ({ id: p.id, prices: p.pricing.items })) }, null, 2));
if (!apply) {
  // Successful read-only diagnostic, even if individual tariffs need correction.
  if (conflicts.length) console.warn('Dry-run only: conflicting tariffs require Data Entry review before publishing.');
  process.exit(0);
}
if (conflicts.length) throw new Error('Publishing blocked: ' + conflicts.length + ' unresolved tariff conflicts (see dry-run report).');

for (const plan of plans) {
  await db.runTransaction(async tx => {
    const current = await tx.get(plan.ref);
    const record = current.data();
    if (!current.exists || record?.publicationStatus !== 'published' ||
        record?.documentId !== plan.id || !isDNSPublicWidgetSnapshot(record.snapshot) ||
        record.snapshot.seasonId !== seasonId || record.snapshot.areaId !== plan.areaId)
      throw new Error('Publication changed during update: ' + plan.id);
    const old = record.snapshot;
    const publishedAt = new Date().toISOString();
    const pricing = { ...plan.pricing, updatedAt: publishedAt };
    // Update only pricing. Trail/weather/logos are owned by separate publishers.
    const next = { ...old, pricing, publishedAt, revision: 'pricing-' + Date.now() + '-' + plan.id };
    tx.update(plan.ref, { snapshot: next });
  });
  const readback = (await plan.ref.get()).data()?.snapshot;
  if (!readback || readback.pricing?.items?.length !== plan.pricing.items.length)
    throw new Error('Widget price readback mismatch: ' + plan.id);
  console.log('Published official customer prices: ' + plan.id);
}
