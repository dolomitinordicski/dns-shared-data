import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
const db = getFirestore();

async function run() {
  const [ratesSnap, catalogSnap, formsSnap] = await Promise.all([
    db.collection('billingRateConfigs').where('seasonId','==','2026-27').get(),
    db.collection('orderCatalogItems').get(),
    db.collection('orderFormConfigs').get(),
  ]);

  const rates = ratesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const catalog = catalogSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const rateIds = new Set(rates.map((r:any) => r.catalogItemId));
  const catalogIds = new Set(catalog.map((c:any) => c.id));

  console.log('RATES', rates.length);
  for (const r of rates as any[]) console.log('RATE', r.catalogItemId, r.billingUnitPrice, r.source?.documentLabel);
  console.log('CATALOG', catalog.length);
  for (const c of catalog as any[]) console.log('CATALOG_ITEM', c.id, c.category, c.code);
  console.log('RATE_WITHOUT_CATALOG', [...rateIds].filter(id => !catalogIds.has(String(id))).join(',') || 'none');
  console.log('CATALOG_WITHOUT_RATE', [...catalogIds].filter(id => !rateIds.has(String(id))).join(',') || 'none');
  console.log('FORMS', formsSnap.docs.length);
  for (const d of formsSnap.docs) console.log('FORM', d.id, JSON.stringify(d.data().catalogItemIds ?? []));
}
run().catch((e)=>{ console.error(e); process.exitCode=1; });
