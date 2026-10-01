import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  DELIVERY_LOCATIONS_2026_27,
  POCKETFOLDER_FORM_CONFIG_2026_27,
  POCKETFOLDER_ITEMS_2026_27,
  POCKETFOLDER_SETUP_SEASON_ID,
  POCKETFOLDER_SOURCE_CELLS_2026_27,
  POCKETFOLDER_SOURCE_FILE,
  POCKETFOLDER_SOURCE_ORGANIZATIONS_2026_27,
  POCKETFOLDER_SOURCE_SHA256,
  POCKETFOLDER_SOURCE_TOTALS_2026_27,
} from '../src/pocketfolder-setup-2026-27.js';

const APPLY = process.argv.includes('--apply');
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? 'dns-core';

function orderId(organizationId: string) {
  return `${POCKETFOLDER_SETUP_SEASON_ID}__pocketfolder__${organizationId}`;
}

function lineId(organizationId: string, catalogItemId: string) {
  return `${orderId(organizationId)}__${catalogItemId}`;
}

async function main() {
  console.log('DNS_Core — 2026-27 Pocketfolder Setup');
  console.log('--------------------------------------');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Source SHA256: ${POCKETFOLDER_SOURCE_SHA256}`);
  console.log(`Editions: ${POCKETFOLDER_ITEMS_2026_27.length}`);
  console.log(`Recipients: ${POCKETFOLDER_SOURCE_ORGANIZATIONS_2026_27.length}`);
  console.log(`Printer total: ${POCKETFOLDER_SOURCE_TOTALS_2026_27.printerTotal}`);

  if (!APPLY) return;

  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();
  const batch = db.batch();

  for (const item of POCKETFOLDER_ITEMS_2026_27) {
    batch.set(db.collection('orderCatalogItems').doc(item.id), item, { merge: true });
  }

  batch.set(
    db.collection('orderFormConfigs').doc(POCKETFOLDER_FORM_CONFIG_2026_27.id),
    POCKETFOLDER_FORM_CONFIG_2026_27,
    { merge: true },
  );

  for (const location of DELIVERY_LOCATIONS_2026_27) {
    batch.set(db.collection('deliveryLocations').doc(location.id), location, { merge: true });
  }

  const markerRef = db.collection('pocketfolderSetupImports').doc(POCKETFOLDER_SETUP_SEASON_ID);
  const marker = await markerRef.get();

  if (!marker.exists) {
    for (const organization of POCKETFOLDER_SOURCE_ORGANIZATIONS_2026_27) {
      const id = orderId(organization.organizationId);
      const header: Record<string, unknown> = {
        id,
        seasonId: POCKETFOLDER_SETUP_SEASON_ID,
        category: 'pocketfolder',
        organizationId: organization.organizationId,
        status: 'draft',
        provenance: {
          sourceSystem: 'legacy-sheet',
          sourceRecordId: `${POCKETFOLDER_SOURCE_FILE} / Folder-Brochure`,
          methodVersion: 1,
          dataStatus: 'draft',
        },
        notes: 'Initial Pocketfolder distribution imported from the 2026-27 workbook.',
      };
      if (organization.reportingAreaId) header.reportingAreaId = organization.reportingAreaId;
      batch.set(db.collection('ticketOrders').doc(id), header);
    }

    for (const cell of POCKETFOLDER_SOURCE_CELLS_2026_27) {
      if (cell.quantity === null) continue;
      const organization = POCKETFOLDER_SOURCE_ORGANIZATIONS_2026_27.find(
        (item) => item.organizationId === cell.organizationId,
      );
      const id = lineId(cell.organizationId, cell.catalogItemId);
      const line: Record<string, unknown> = {
        id,
        ticketOrderId: orderId(cell.organizationId),
        seasonId: POCKETFOLDER_SETUP_SEASON_ID,
        organizationId: cell.organizationId,
        catalogItemId: cell.catalogItemId,
        quantity: cell.quantity,
        provenance: {
          sourceSystem: 'legacy-sheet',
          sourceRecordId: `${POCKETFOLDER_SOURCE_FILE} / Folder-Brochure`,
          methodVersion: 1,
          dataStatus: 'draft',
        },
      };
      if (organization?.reportingAreaId) line.reportingAreaId = organization.reportingAreaId;
      batch.set(db.collection('ticketOrderLines').doc(id), line);
    }

    batch.set(markerRef, {
      seasonId: POCKETFOLDER_SETUP_SEASON_ID,
      source: POCKETFOLDER_SOURCE_FILE,
      sourceSha256: POCKETFOLDER_SOURCE_SHA256,
      printerTotal: POCKETFOLDER_SOURCE_TOTALS_2026_27.printerTotal,
      imported: true,
      importedAt: new Date().toISOString(),
      note: 'One-time Pocketfolder operational import. Future seed reruns preserve edited quantities.',
    });
  } else {
    console.log('Pocketfolder import marker already exists; preserving current quantities.');
  }

  await batch.commit();

  console.log('✓ orderCatalogItems / Pocketfolder editions');
  console.log('✓ orderFormConfigs / pocketfolder');
  console.log('✓ deliveryLocations');
  console.log(marker.exists ? '✓ Pocketfolder quantities preserved' : '✓ Pocketfolder source quantities imported');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
