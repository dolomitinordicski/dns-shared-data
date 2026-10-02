import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const TARGET_PROJECT_ID = 'dns-core';
const SEASON_ID = '2026-27';
const APPLY = process.argv.includes('--apply');

const WRISTBAND_ITEM_IDS = [
  'wristband-14-yellow',
  'wristband-16-red',
  'wristband-33-grape',
  'wristband-15-light-green',
  'wristband-13-blue',
  'wristband-20-black',
  'wristband-51-gold',
  'wristband-11-white',
] as const;

const TICKET_ITEM_IDS = [
  'wk-area',
  'wk-dns',
  'sk-area',
  'sk-dns',
  'complimentary',
  'sk-instructor',
  'press',
] as const;

const ticketUnitPrice = Math.round((2200 / 24415) * 100000000) / 100000000;

type BillingRateSeed = {
  id: string;
  seasonId: string;
  sourceType: 'order';
  catalogItemId: string;
  billingUnitPrice: number;
  currency: 'EUR';
  source: Record<string, unknown>;
  active: true;
  revision: number;
  notes: string;
};

function wristbandRate(catalogItemId: string): BillingRateSeed {
  const id = `${SEASON_ID}__order__${catalogItemId}`;
  return {
    id,
    seasonId: SEASON_ID,
    sourceType: 'order',
    catalogItemId,
    billingUnitPrice: 0.159,
    currency: 'EUR',
    source: {
      documentLabel: 'Brady Italia / PDC · ordine 1013437506',
      supplier: 'Brady Italia srl T/A PDC',
      documentDate: '2026-09-02',
      packSize: 100,
      packPriceNet: 15.9,
      calculatedPurchaseUnitPrice: 0.159,
    },
    active: true,
    revision: 1,
    notes:
      'Preisquelle: 15,90 EUR netto je 100er-Pack. Fakturierbare Menge ausschließlich aus DNS Data Entry.',
  };
}

function ticketRate(catalogItemId: string): BillingRateSeed {
  const id = `${SEASON_ID}__order__${catalogItemId}`;
  return {
    id,
    seasonId: SEASON_ID,
    sourceType: 'order',
    catalogItemId,
    billingUnitPrice: ticketUnitPrice,
    currency: 'EUR',
    source: {
      documentLabel: 'Südtirol Druck · Angebot AN26-1505',
      supplier: 'Südtirol Druck',
      documentDate: '2026-09-30',
      totalQuantity: 24415,
      totalAmount: 2200,
      calculatedPurchaseUnitPrice: ticketUnitPrice,
    },
    active: true,
    revision: 1,
    notes:
      'Durchschnittlicher Netto-Stückpreis aus 2.200,00 EUR / 24.415 Stück. Gutschrift 2025 (-100 EUR) nicht in den Stückpreis eingerechnet.',
  };
}

const rates = [
  ...WRISTBAND_ITEM_IDS.map(wristbandRate),
  ...TICKET_ITEM_IDS.map(ticketRate),
];

async function seed() {
  console.log('');
  console.log('DNS Faktura — Billing rates 2026/27');
  console.log('-----------------------------------');
  console.log(`Target project: ${TARGET_PROJECT_ID}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Rates: ${rates.length}`);
  console.log('');

  if (!APPLY) {
    for (const rate of rates) {
      console.log(
        `${rate.catalogItemId.padEnd(32)} ${rate.billingUnitPrice.toFixed(8)} EUR`,
      );
    }
    console.log('');
    console.log('No Firestore writes performed.');
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

  for (const rate of rates) {
    const ref = db.collection('billingRateConfigs').doc(rate.id);
    const existing = await ref.get();

    if (!existing.exists) {
      await ref.set({
        ...rate,
        updatedBy: 'dns-core-admin-seed',
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`✓ created ${rate.id}`);
      continue;
    }

    const current = existing.data() as Record<string, unknown>;
    const sameKnownSeed =
      current.seasonId === rate.seasonId &&
      current.sourceType === rate.sourceType &&
      current.catalogItemId === rate.catalogItemId &&
      current.billingUnitPrice === rate.billingUnitPrice &&
      current.currency === rate.currency &&
      current.active === rate.active;

    if (sameKnownSeed) {
      console.log(`= unchanged ${rate.id}`);
      continue;
    }

    console.log(
      `! preserved existing ${rate.id} (existing configuration differs from known seed)`,
    );
  }

  console.log('');
  console.log('✓ Billing-rate seed complete.');
}

seed().catch((error) => {
  console.error('');
  console.error('Billing-rate seed failed.');
  console.error(error);
  process.exitCode = 1;
});
