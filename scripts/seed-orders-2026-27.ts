import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  ORDER_CATALOG_2026_27,
  ORDER_FORM_CONFIGS_2026_27,
  ORDER_SETUP_SEASON_ID,
  ORDER_SOURCE_ORGANIZATIONS_2026_27,
  TICKET_SOURCE_CELLS_2026_27,
  WRISTBAND_SOURCE_CELLS_2026_27,
  productCodeForCatalogItem,
} from '../src/order-setup-2026-27.js';
import type { OrderCatalogCategory } from '../src/seasonal-operational-data.js';

const APPLY = process.argv.includes('--apply');
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? 'dns-core';

function orderId(category: OrderCatalogCategory, organizationId: string) {
  return `${ORDER_SETUP_SEASON_ID}__${category}__${organizationId}`;
}

function lineId(
  category: OrderCatalogCategory,
  organizationId: string,
  catalogItemId: string,
) {
  return `${orderId(category, organizationId)}__${catalogItemId}`;
}

function sourceSheet(category: OrderCatalogCategory) {
  return category === 'wristband'
    ? 'Armbänder-braccialetti'
    : 'Wochen- und Saisonkarten-settim';
}

function sourceRow(category: OrderCatalogCategory, organizationId: string) {
  const source = ORDER_SOURCE_ORGANIZATIONS_2026_27.find(
    (organization) => organization.organizationId === organizationId,
  );
  return category === 'wristband'
    ? source?.wristbandSourceRow
    : source?.ticketSourceRow;
}

function sourceColumn(category: OrderCatalogCategory, itemIndex: number) {
  // All 2026-27 order quantities begin in column B.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return alphabet[itemIndex + 1];
}

async function main() {
  console.log('DNS_Core — 2026-27 Order Persistence Seed');
  console.log('------------------------------------------');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);

  if (!APPLY) {
    console.log(`Catalog items: ${ORDER_CATALOG_2026_27.length}`);
    console.log(`Form configs: ${ORDER_FORM_CONFIGS_2026_27.length}`);
    console.log('Operational import is guarded by orderSetupImports/2026-27.');
    return;
  }

  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });

  const db = getFirestore();
  const batch = db.batch();

  for (const item of ORDER_CATALOG_2026_27) {
    batch.set(db.collection('orderCatalogItems').doc(item.id), item, { merge: true });
  }

  for (const config of ORDER_FORM_CONFIGS_2026_27) {
    batch.set(db.collection('orderFormConfigs').doc(config.id), config, { merge: true });
  }

  const markerRef = db.collection('orderSetupImports').doc(ORDER_SETUP_SEASON_ID);
  const marker = await markerRef.get();

  if (!marker.exists) {
    const categories: readonly {
      category: OrderCatalogCategory;
      cells: typeof WRISTBAND_SOURCE_CELLS_2026_27;
    }[] = [
      { category: 'wristband', cells: WRISTBAND_SOURCE_CELLS_2026_27 },
      { category: 'ticket', cells: TICKET_SOURCE_CELLS_2026_27 },
    ];

    for (const { category, cells } of categories) {
      const organizations = ORDER_SOURCE_ORGANIZATIONS_2026_27.filter((organization) =>
        category === 'wristband'
          ? Boolean(organization.wristbandSourceRow)
          : Boolean(organization.ticketSourceRow),
      );
      const items = ORDER_CATALOG_2026_27.filter((item) => item.category === category);

      for (const organization of organizations) {
        const id = orderId(category, organization.organizationId);
        const header: Record<string, unknown> = {
          id,
          seasonId: ORDER_SETUP_SEASON_ID,
          category,
          organizationId: organization.organizationId,
          status: 'draft',
          provenance: {
            sourceSystem: 'legacy-sheet',
            sourceRecordId: `ALL TICKETS 2026-27.xlsx / ${sourceSheet(category)}!A${sourceRow(category, organization.organizationId)}`,
            methodVersion: 1,
            dataStatus: 'draft',
          },
          notes: 'Initial import from the 2026-27 operational order workbook.',
        };
        if (organization.reportingAreaId) {
          header.reportingAreaId = organization.reportingAreaId;
        }
        batch.set(db.collection('ticketOrders').doc(id), header);
      }

      for (const cell of cells) {
        if (cell.quantity === null) continue;

        const organization = ORDER_SOURCE_ORGANIZATIONS_2026_27.find(
          (item) => item.organizationId === cell.organizationId,
        );
        const itemIndex = items.findIndex((item) => item.id === cell.catalogItemId);
        const id = lineId(category, cell.organizationId, cell.catalogItemId);
        const line: Record<string, unknown> = {
          id,
          ticketOrderId: orderId(category, cell.organizationId),
          seasonId: ORDER_SETUP_SEASON_ID,
          organizationId: cell.organizationId,
          catalogItemId: cell.catalogItemId,
          quantity: cell.quantity,
          provenance: {
            sourceSystem: 'legacy-sheet',
            sourceRecordId: `ALL TICKETS 2026-27.xlsx / ${sourceSheet(category)}!${sourceColumn(category, itemIndex)}${sourceRow(category, cell.organizationId)}`,
            methodVersion: 1,
            dataStatus: 'draft',
          },
        };
        if (organization?.reportingAreaId) {
          line.reportingAreaId = organization.reportingAreaId;
        }
        const productCode = productCodeForCatalogItem(cell.catalogItemId);
        if (productCode) line.productCode = productCode;

        batch.set(db.collection('ticketOrderLines').doc(id), line);
      }
    }

    batch.set(markerRef, {
      seasonId: ORDER_SETUP_SEASON_ID,
      source: 'ALL TICKETS 2026-27.xlsx',
      imported: true,
      importedAt: new Date().toISOString(),
      note: 'One-time operational import marker. Future seed reruns update catalogue/config only.',
    });
  } else {
    console.log('Operational import marker already exists; preserving current order data.');
  }

  await batch.commit();

  console.log('✓ orderCatalogItems');
  console.log('✓ orderFormConfigs');
  console.log(marker.exists ? '✓ operational import preserved' : '✓ initial ticketOrders/ticketOrderLines imported');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
