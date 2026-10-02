import type {
  OrderCatalogItem,
  OrderFormConfig,
  OrderCatalogCategory,
  TicketProductCode,
} from './seasonal-operational-data.js';
import type { OrganizationId, ReportingAreaId } from './canonical-data.js';

export const ORDER_SETUP_SEASON_ID = '2026-27' as const;

export interface OrderSourceOrganization {
  organizationId: OrganizationId;
  reportingAreaId?: ReportingAreaId;
  sourceLabel: string;
  defaultDeliveryLocationId?: string;
  wristbandSourceRow?: number;
  ticketSourceRow?: number;
}

export interface OrderSourceCell {
  organizationId: OrganizationId;
  catalogItemId: string;
  quantity: number | null;
}

const ticketLabel = (
  de: string,
  it: string,
  en: string,
) => ({ de, it, en });

export const ORDER_CATALOG_2026_27: readonly OrderCatalogItem[] = [
  {
    id: '2026-27-wristband-14-yellow',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'wristband',
    code: '14-yellow',
    label: ticketLabel('14 yellow', '14 yellow', '14 yellow'),
    displayOrder: 1,
    active: true,
    physicalVariantCode: '14 yellow',
    displayColorHex: '#FFD91A',
    displayTextColorHex: '#111111',
    supplierColorReference: '803C',
  },
  {
    id: '2026-27-wristband-16-red',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'wristband',
    code: '16-red',
    label: ticketLabel('16 red', '16 red', '16 red'),
    displayOrder: 2,
    active: true,
    physicalVariantCode: '16 red',
    displayColorHex: '#E51D2A',
    displayTextColorHex: '#FFFFFF',
    supplierColorReference: '185C',
  },
  {
    id: '2026-27-wristband-33-grape',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'wristband',
    code: '33-grape',
    label: ticketLabel('33 grape', '33 grape', '33 grape'),
    displayOrder: 3,
    active: true,
    physicalVariantCode: '33 grape',
    displayColorHex: '#C74398',
    displayTextColorHex: '#111111',
    supplierColorReference: '807C',
  },
  {
    id: '2026-27-wristband-15-light-green',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'wristband',
    code: '15-light-green',
    label: ticketLabel('15 light green', '15 light green', '15 light green'),
    displayOrder: 4,
    active: true,
    physicalVariantCode: '15 light green',
    displayColorHex: '#45A276',
    displayTextColorHex: '#FFFFFF',
    supplierColorReference: 'CMYK · reorder 34186062',
  },
  {
    id: '2026-27-wristband-13-blue',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'wristband',
    code: '13-blue',
    label: ticketLabel('13 blue', '13 blue', '13 blue'),
    displayOrder: 5,
    active: true,
    physicalVariantCode: '13 blue',
    displayColorHex: '#1088B8',
    displayTextColorHex: '#111111',
    supplierColorReference: 'Process Blue C',
  },
  {
    id: '2026-27-wristband-20-black',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'wristband',
    code: '20-black',
    label: ticketLabel('20 black', '20 black', '20 black'),
    displayOrder: 6,
    active: true,
    physicalVariantCode: '20 black',
    displayColorHex: '#272324',
    displayTextColorHex: '#FFFFFF',
    supplierColorReference: 'Black',
  },
  {
    id: '2026-27-wristband-51-gold',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'wristband',
    code: '51-gold',
    label: ticketLabel('51 gold', '51 gold', '51 gold'),
    displayOrder: 7,
    active: true,
    physicalVariantCode: '51 gold',
    displayColorHex: '#97805A',
    displayTextColorHex: '#111111',
    supplierColorReference: '872C',
  },
  {
    id: '2026-27-wristband-11-white',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'wristband',
    code: '11-white',
    label: ticketLabel('11 white', '11 white', '11 white'),
    displayOrder: 8,
    active: true,
    physicalVariantCode: '11 white',
    displayColorHex: '#FFFFFF',
    displayTextColorHex: '#111111',
    notes: 'Present in the 2026-27 order workbook; not shown in the supplied colour-reference image.',
  },
  {
    id: '2026-27-wk-area',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'ticket',
    code: 'wk-area',
    label: ticketLabel('Wochenkarte Lokal', 'Settimanale locale', 'Local weekly pass'),
    displayOrder: 1,
    active: true,
    productCode: 'wk-area',
  },
  {
    id: '2026-27-wk-dns',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'ticket',
    code: 'wk-dns',
    label: ticketLabel('Wochenkarte DNS', 'Settimanale DNS', 'DNS weekly pass'),
    displayOrder: 2,
    active: true,
    productCode: 'wk-dns',
  },
  {
    id: '2026-27-sk-area',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'ticket',
    code: 'sk-area',
    label: ticketLabel('Saisonkarte Lokal', 'Stagionale locale', 'Local season pass'),
    displayOrder: 3,
    active: true,
    productCode: 'sk-area',
  },
  {
    id: '2026-27-sk-dns',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'ticket',
    code: 'sk-dns',
    label: ticketLabel('Saisonkarte DNS', 'Stagionale DNS', 'DNS season pass'),
    displayOrder: 4,
    active: true,
    productCode: 'sk-dns',
  },
  {
    id: '2026-27-complimentary',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'ticket',
    code: 'complimentary',
    label: ticketLabel('Freikarten', 'Biglietti in omaggio', 'Complimentary passes'),
    displayOrder: 5,
    active: true,
  },
  {
    id: '2026-27-sk-instructor',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'ticket',
    code: 'sk-instructor',
    label: ticketLabel(
      'Langlauflehrer-Karten',
      'Tessere per maestri sci fondo',
      'Cross-country instructor passes',
    ),
    displayOrder: 6,
    active: true,
    productCode: 'sk-instructor',
  },
  {
    id: '2026-27-press',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'ticket',
    code: 'press',
    label: ticketLabel('PRESS', 'PRESS', 'PRESS'),
    displayOrder: 7,
    active: true,
  },
] as const satisfies readonly OrderCatalogItem[];

export const ORDER_SOURCE_ORGANIZATIONS_2026_27: readonly OrderSourceOrganization[] = [
  { organizationId: 'antholzertal', defaultDeliveryLocationId: 'delivery-antholzertal-tv', reportingAreaId: 'antholzertal', sourceLabel: 'Antholzertal (für TV)', wristbandSourceRow: 3, ticketSourceRow: 5 },
  { organizationId: 'biathlon-antholz', defaultDeliveryLocationId: 'delivery-biathlon-antholz', reportingAreaId: 'antholzertal', sourceLabel: 'Antholzertal (für Biathlon)', wristbandSourceRow: 4, ticketSourceRow: 6 },
  { organizationId: 'gsiesertal-welsberg-taisten', defaultDeliveryLocationId: 'delivery-gsies-welsberg', reportingAreaId: 'gsiesertal-welsberg-taisten', sourceLabel: 'Gsies-Welsberg-Taisten', wristbandSourceRow: 5, ticketSourceRow: 7 },
  { organizationId: 'tv-toblach', defaultDeliveryLocationId: 'delivery-tv-toblach', reportingAreaId: 'drei-zinnen', sourceLabel: '3ZD - Toblach', wristbandSourceRow: 6, ticketSourceRow: 8 },
  { organizationId: 'tv-niederdorf', defaultDeliveryLocationId: 'delivery-tv-niederdorf', reportingAreaId: 'drei-zinnen', sourceLabel: '3ZD - Niederdorf', wristbandSourceRow: 7, ticketSourceRow: 9 },
  { organizationId: 'tv-innichen', defaultDeliveryLocationId: 'delivery-tv-innichen', reportingAreaId: 'drei-zinnen', sourceLabel: '3ZD - Innichen', wristbandSourceRow: 8, ticketSourceRow: 10 },
  { organizationId: 'tv-sexten', defaultDeliveryLocationId: 'delivery-tv-sexten', reportingAreaId: 'drei-zinnen', sourceLabel: '3ZD - Sexten', wristbandSourceRow: 9, ticketSourceRow: 11 },
  { organizationId: 'tv-prags', defaultDeliveryLocationId: 'delivery-tv-prags', reportingAreaId: 'drei-zinnen', sourceLabel: '3ZD - Prags', wristbandSourceRow: 10, ticketSourceRow: 12 },
  { organizationId: 'tvb-osttirol', defaultDeliveryLocationId: 'delivery-osttirol', reportingAreaId: 'osttirol', sourceLabel: 'Osttirol', wristbandSourceRow: 11, ticketSourceRow: 13 },
  { organizationId: 'val-comelico', defaultDeliveryLocationId: 'delivery-comelico', reportingAreaId: 'val-comelico', sourceLabel: 'Comelico', wristbandSourceRow: 12, ticketSourceRow: 14 },
  { organizationId: 'servizi-ampezzo', defaultDeliveryLocationId: 'delivery-cortina', reportingAreaId: 'cortina-d-ampezzo', sourceLabel: 'Cortina', wristbandSourceRow: 13, ticketSourceRow: 15 },
  { organizationId: 'sand-in-taufers', defaultDeliveryLocationId: 'delivery-sand-in-taufers', reportingAreaId: 'ahrntal', sourceLabel: 'TV Sand in Taufers', wristbandSourceRow: 14, ticketSourceRow: 16 },
  { organizationId: 'ahrntal', defaultDeliveryLocationId: 'delivery-ahrntal', reportingAreaId: 'ahrntal', sourceLabel: 'TV Ahrntal', wristbandSourceRow: 15, ticketSourceRow: 17 },
  { organizationId: 'val-gardena', defaultDeliveryLocationId: 'delivery-val-gardena', reportingAreaId: 'seiser-alm-dolomites-val-gardena', sourceLabel: 'Gröden', wristbandSourceRow: 16, ticketSourceRow: 18 },
  { organizationId: 'seiser-alm-marketing', defaultDeliveryLocationId: 'delivery-seiser-alm', reportingAreaId: 'seiser-alm-dolomites-val-gardena', sourceLabel: 'Seiser Alm', wristbandSourceRow: 17, ticketSourceRow: 19 },
  { organizationId: 'dolomiti-nordicski', defaultDeliveryLocationId: 'delivery-dns-office', sourceLabel: 'Dolomiti Nordicski', ticketSourceRow: 20 },
] as const;

const wristbandIds = ORDER_CATALOG_2026_27
  .filter((item) => item.category === 'wristband')
  .map((item) => item.id);

const ticketIds = ORDER_CATALOG_2026_27
  .filter((item) => item.category === 'ticket')
  .map((item) => item.id);

export const ORDER_FORM_CONFIGS_2026_27: readonly OrderFormConfig[] = [
  {
    id: '2026-27-wristband',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'wristband',
    catalogItemIds: wristbandIds,
    organizationIds: ORDER_SOURCE_ORGANIZATIONS_2026_27
      .filter((organization) => organization.wristbandSourceRow)
      .map((organization) => organization.organizationId),
    active: true,
    provenance: {
      sourceSystem: 'legacy-sheet',
      sourceRecordId: 'ALL TICKETS 2026-27.xlsx / Armbänder-braccialetti',
      methodVersion: 1,
      dataStatus: 'draft',
    },
  },
  {
    id: '2026-27-ticket',
    seasonId: ORDER_SETUP_SEASON_ID,
    category: 'ticket',
    catalogItemIds: ticketIds,
    organizationIds: ORDER_SOURCE_ORGANIZATIONS_2026_27
      .filter((organization) => organization.ticketSourceRow)
      .map((organization) => organization.organizationId),
    active: true,
    provenance: {
      sourceSystem: 'legacy-sheet',
      sourceRecordId: 'ALL TICKETS 2026-27.xlsx / Wochen- und Saisonkarten-settim',
      methodVersion: 1,
      dataStatus: 'draft',
    },
  },
] as const;

function sourceCells(
  category: OrderCatalogCategory,
  matrix: readonly (readonly (number | null)[])[],
): OrderSourceCell[] {
  const organizations = ORDER_SOURCE_ORGANIZATIONS_2026_27.filter((organization) =>
    category === 'wristband'
      ? Boolean(organization.wristbandSourceRow)
      : Boolean(organization.ticketSourceRow),
  );
  const items = ORDER_CATALOG_2026_27.filter((item) => item.category === category);

  return organizations.flatMap((organization, rowIndex) =>
    items.map((item, columnIndex) => ({
      organizationId: organization.organizationId,
      catalogItemId: item.id,
      quantity: matrix[rowIndex][columnIndex] ?? null,
    })),
  );
}

export const WRISTBAND_SOURCE_CELLS_2026_27 = sourceCells('wristband', [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [500, 1000, 700, 900, 800, 900, 1500, 0],
  [1200, 1800, 1300, 1200, 1500, 1400, 1300, 0],
  [0, 1100, 0, 0, 0, 100, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [400, 0, 0, 200, 0, 600, 500, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [1500, 2000, 1000, 1500, 2000, 1500, 1500, 0],
  [250, 250, 250, 250, 250, 250, 0, null],
  [0, 0, 0, 0, 0, 0, 0, null],
  [600, 600, 600, 600, 600, 600, 600, 0],
  [400, 400, 400, 400, 400, 400, 400, 0],
  [400, 400, 400, 400, 400, 400, 400, 0],
  [2000, 2500, 2000, 2000, 2000, 2000, 2000, 0],
]);

export const TICKET_SOURCE_CELLS_2026_27 = sourceCells('ticket', [
  [350, 450, 350, 600, 20, 15, 0],
  [500, 350, 60, 80, 10, 20, 0],
  [800, 1000, 600, 800, 0, 5, 0],
  [1600, 2200, 350, 500, 0, 30, 0],
  [120, 400, 100, 200, 0, 5, 0],
  [200, 200, 100, 120, 0, 5, 0],
  [700, 200, 200, 200, 0, 5, 0],
  [200, 400, 50, 80, null, null, null],
  [1500, 1000, 2000, 1000, 5, 0, 5],
  [50, 50, 150, 150, 5, 20, 0],
  [100, 40, 300, 150, 20, 20, 10],
  [200, 100, 100, 200, 0, 5, 0],
  [150, 50, 150, 100, 10, 0, 0],
  [80, 20, 100, 60, 25, null, 5],
  [1500, 50, 200, 20, 30, 20, 20],
  [0, 250, 0, 200, 0, 0, 20],
]);

export const ORDER_SOURCE_TOTALS_2026_27 = {
  wristband: 55700,
  ticket: 24415,
} as const;

export function productCodeForCatalogItem(
  catalogItemId: string,
): TicketProductCode | undefined {
  return ORDER_CATALOG_2026_27.find((item) => item.id === catalogItemId)?.productCode;
}
