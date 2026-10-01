import type {
  DeliveryLocation,
  OrderCatalogItem,
  OrderFormConfig,
  PocketfolderSourceRow,
} from './seasonal-operational-data.js';
import type { OrganizationId, ReportingAreaId } from './canonical-data.js';

export const POCKETFOLDER_SETUP_SEASON_ID = '2026-27' as const;
export const POCKETFOLDER_SOURCE_FILE =
  'FOLDER BROCHURE WS 2026-27 mit Lieferadressen für Dialog.xlsx' as const;
export const POCKETFOLDER_SOURCE_SHA256 =
  'eec13230d40484685c79d5bd9d0cbd7d766a12ff32d8fa80b706ae8a5b0d6f5b' as const;

const label = (de: string, it: string, en: string) => ({ de, it, en });

export const POCKETFOLDER_ITEMS_2026_27: readonly OrderCatalogItem[] = [
  {
    id: '2026-27-pocketfolder-antholzertal',
    seasonId: POCKETFOLDER_SETUP_SEASON_ID,
    category: 'pocketfolder',
    code: 'antholzertal',
    label: label('Antholzertal', 'Valle Anterselva', 'Antholzertal'),
    displayOrder: 1,
    active: true,
    pocketfolder: {
      reportingAreaId: 'antholzertal',
      backLanguageOrder: 'de-it-en',
      sourceComparison2025: 4250,
      sourceAreaTotal2026: 4200,
      sourcePrinterTotal2026: 4550,
      areaTotalOrganizationIds: ['antholzertal', 'biathlon-antholz', 'dolomiti-nordicski'],
    },
  },
  {
    id: '2026-27-pocketfolder-gsiesertal-welsberg-taisten',
    seasonId: POCKETFOLDER_SETUP_SEASON_ID,
    category: 'pocketfolder',
    code: 'gsiesertal-welsberg-taisten',
    label: label('Gsiesertal–Welsberg–Taisten', 'Val Casies–Monguelfo–Tesido', 'Gsiesertal–Welsberg–Taisten'),
    displayOrder: 2,
    active: true,
    pocketfolder: {
      reportingAreaId: 'gsiesertal-welsberg-taisten',
      backLanguageOrder: 'de-it-en',
      sourceComparison2025: 3850,
      sourceAreaTotal2026: 5200,
      sourcePrinterTotal2026: 5500,
      areaTotalOrganizationIds: ['gsiesertal-welsberg-taisten', 'dolomiti-nordicski'],
    },
  },
  {
    id: '2026-27-pocketfolder-drei-zinnen',
    seasonId: POCKETFOLDER_SETUP_SEASON_ID,
    category: 'pocketfolder',
    code: 'drei-zinnen',
    label: label('3 Zinnen Dolomites', '3 Cime Dolomiti', '3 Zinnen Dolomites'),
    displayOrder: 3,
    active: true,
    pocketfolder: {
      reportingAreaId: 'drei-zinnen',
      backLanguageOrder: 'de-it-en',
      sourceComparison2025: 42100,
      sourceAreaTotal2026: 11200,
      sourcePrinterTotal2026: 12100,
      areaTotalOrganizationIds: ['tv-toblach', 'tv-sexten', 'tv-innichen', 'tv-prags', 'tv-niederdorf', 'dolomiti-nordicski'],
    },
  },
  {
    id: '2026-27-pocketfolder-osttirol',
    seasonId: POCKETFOLDER_SETUP_SEASON_ID,
    category: 'pocketfolder',
    code: 'osttirol',
    label: label('Osttirol', 'Osttirol', 'Osttirol'),
    displayOrder: 4,
    active: true,
    pocketfolder: {
      reportingAreaId: 'osttirol',
      backLanguageOrder: 'de-it-en',
      sourceComparison2025: 7220,
      sourceAreaTotal2026: 200,
      sourcePrinterTotal2026: 250,
      areaTotalOrganizationIds: ['tvb-osttirol', 'dolomiti-nordicski'],
    },
  },
  {
    id: '2026-27-pocketfolder-val-comelico',
    seasonId: POCKETFOLDER_SETUP_SEASON_ID,
    category: 'pocketfolder',
    code: 'val-comelico',
    label: label('Comelico', 'Comelico', 'Comelico'),
    displayOrder: 5,
    active: true,
    pocketfolder: {
      reportingAreaId: 'val-comelico',
      backLanguageOrder: 'it-de-en',
      sourceComparison2025: 1500,
      sourceAreaTotal2026: 2000,
      sourcePrinterTotal2026: 2000,
      areaTotalOrganizationIds: ['val-comelico', 'dolomiti-nordicski'],
    },
  },
  {
    id: '2026-27-pocketfolder-cortina',
    seasonId: POCKETFOLDER_SETUP_SEASON_ID,
    category: 'pocketfolder',
    code: 'cortina-d-ampezzo',
    label: label("Cortina d'Ampezzo", "Cortina d'Ampezzo", "Cortina d'Ampezzo"),
    displayOrder: 6,
    active: true,
    pocketfolder: {
      reportingAreaId: 'cortina-d-ampezzo',
      backLanguageOrder: 'it-de-en',
      sourceComparison2025: 325,
      sourceAreaTotal2026: 0,
      sourcePrinterTotal2026: 200,
      areaTotalOrganizationIds: ['servizi-ampezzo', 'dolomiti-nordicski'],
    },
  },
  {
    id: '2026-27-pocketfolder-ahrntal',
    seasonId: POCKETFOLDER_SETUP_SEASON_ID,
    category: 'pocketfolder',
    code: 'ahrntal',
    label: label('Ahrntal + Sand in Taufers', 'Valle Aurina + Campo Tures', 'Ahrntal + Sand in Taufers'),
    displayOrder: 7,
    active: true,
    pocketfolder: {
      reportingAreaId: 'ahrntal',
      backLanguageOrder: 'de-it-en',
      sourceComparison2025: 7650,
      sourceAreaTotal2026: 200,
      sourcePrinterTotal2026: 350,
      areaTotalOrganizationIds: ['ahrntal', 'sand-in-taufers', 'dolomiti-nordicski'],
    },
  },
  {
    id: '2026-27-pocketfolder-seiser-alm-val-gardena',
    seasonId: POCKETFOLDER_SETUP_SEASON_ID,
    category: 'pocketfolder',
    code: 'seiser-alm-val-gardena',
    label: label('Seiser Alm + Gröden', 'Alpe di Siusi + Val Gardena', 'Seiser Alm + Val Gardena'),
    displayOrder: 8,
    active: true,
    pocketfolder: {
      reportingAreaId: 'seiser-alm-dolomites-val-gardena',
      backLanguageOrder: 'de-it-en',
      sourceComparison2025: 6000,
      sourceAreaTotal2026: 200,
      sourcePrinterTotal2026: 200,
      areaTotalOrganizationIds: ['val-gardena', 'seiser-alm-marketing', 'dolomiti-nordicski'],
    },
  },
] as const;

export interface PocketfolderSourceOrganization {
  organizationId: OrganizationId;
  reportingAreaId?: ReportingAreaId;
  sourceLabel: string;
  defaultDeliveryLocationId?: string;
}

export const POCKETFOLDER_SOURCE_ORGANIZATIONS_2026_27: readonly PocketfolderSourceOrganization[] = [
  { organizationId: 'antholzertal', reportingAreaId: 'antholzertal', sourceLabel: 'TV Antholzertal', defaultDeliveryLocationId: 'delivery-antholzertal-tv' },
  { organizationId: 'biathlon-antholz', reportingAreaId: 'antholzertal', sourceLabel: 'Biathlonzentrum Antholz', defaultDeliveryLocationId: 'delivery-biathlon-antholz' },
  { organizationId: 'gsiesertal-welsberg-taisten', reportingAreaId: 'gsiesertal-welsberg-taisten', sourceLabel: 'TV Welsberg / Gsiesertal', defaultDeliveryLocationId: 'delivery-gsies-welsberg' },
  { organizationId: 'tv-toblach', reportingAreaId: 'drei-zinnen', sourceLabel: 'TV Toblach', defaultDeliveryLocationId: 'delivery-tv-toblach' },
  { organizationId: 'tv-niederdorf', reportingAreaId: 'drei-zinnen', sourceLabel: 'TV Niederdorf', defaultDeliveryLocationId: 'delivery-tv-niederdorf' },
  { organizationId: 'tv-innichen', reportingAreaId: 'drei-zinnen', sourceLabel: 'TV Innichen', defaultDeliveryLocationId: 'delivery-tv-innichen' },
  { organizationId: 'tv-sexten', reportingAreaId: 'drei-zinnen', sourceLabel: 'TV Sexten', defaultDeliveryLocationId: 'delivery-tv-sexten' },
  { organizationId: 'tv-prags', reportingAreaId: 'drei-zinnen', sourceLabel: 'TV Prags', defaultDeliveryLocationId: 'delivery-tv-prags' },
  { organizationId: 'tvb-osttirol', reportingAreaId: 'osttirol', sourceLabel: 'Osttirol', defaultDeliveryLocationId: 'delivery-osttirol' },
  { organizationId: 'val-comelico', reportingAreaId: 'val-comelico', sourceLabel: 'Comelico', defaultDeliveryLocationId: 'delivery-comelico' },
  { organizationId: 'servizi-ampezzo', reportingAreaId: 'cortina-d-ampezzo', sourceLabel: 'Cortina', defaultDeliveryLocationId: 'delivery-cortina' },
  { organizationId: 'sand-in-taufers', reportingAreaId: 'ahrntal', sourceLabel: 'TV Sand in Taufers', defaultDeliveryLocationId: 'delivery-sand-in-taufers' },
  { organizationId: 'ahrntal', reportingAreaId: 'ahrntal', sourceLabel: 'TV Ahrntal', defaultDeliveryLocationId: 'delivery-ahrntal' },
  { organizationId: 'val-gardena', reportingAreaId: 'seiser-alm-dolomites-val-gardena', sourceLabel: 'Gröden', defaultDeliveryLocationId: 'delivery-val-gardena' },
  { organizationId: 'seiser-alm-marketing', reportingAreaId: 'seiser-alm-dolomites-val-gardena', sourceLabel: 'Seiser Alm', defaultDeliveryLocationId: 'delivery-seiser-alm' },
  { organizationId: 'dolomiti-nordicski', sourceLabel: 'Dolomiti NordicSki', defaultDeliveryLocationId: 'delivery-dns-office' },
] as const;

export const POCKETFOLDER_FORM_CONFIG_2026_27: OrderFormConfig = {
  id: '2026-27-pocketfolder',
  seasonId: POCKETFOLDER_SETUP_SEASON_ID,
  category: 'pocketfolder',
  catalogItemIds: POCKETFOLDER_ITEMS_2026_27.map((item) => item.id),
  organizationIds: POCKETFOLDER_SOURCE_ORGANIZATIONS_2026_27.map((organization) => organization.organizationId),
  active: true,
  provenance: {
    sourceSystem: 'legacy-sheet',
    sourceRecordId: `${POCKETFOLDER_SOURCE_FILE} / Folder-Brochure`,
    methodVersion: 1,
    dataStatus: 'draft',
  },
};

type PocketfolderCell = {
  organizationId: OrganizationId;
  catalogItemId: string;
  quantity: number | null;
};

const itemIds = POCKETFOLDER_ITEMS_2026_27.map((item) => item.id);

function cells(matrix: readonly (readonly (number | null)[])[]): PocketfolderCell[] {
  return POCKETFOLDER_SOURCE_ORGANIZATIONS_2026_27.flatMap((organization, rowIndex) =>
    itemIds.map((catalogItemId, columnIndex) => ({
      organizationId: organization.organizationId,
      catalogItemId,
      quantity: matrix[rowIndex][columnIndex] ?? null,
    })),
  );
}

export const POCKETFOLDER_SOURCE_CELLS_2026_27: readonly PocketfolderCell[] = cells([
  [3000, 200, 200, null, null, 100, 100, null],
  [1000, null, null, null, null, null, null, null],
  [300, 5000, 700, null, null, 50, 50, null],
  [50, 100, 2000, 50, null, 50, null, null],
  [null, null, null, null, null, null, null, null],
  [0, 0, 3000, 0, null, 0, null, null],
  [null, null, 6000, null, null, null, null, null],
  [0, 0, 0, 0, null, 0, 0, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, 1800, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [200, 200, 200, 200, 200, 0, 200, 200],
]);

export const POCKETFOLDER_SOURCE_TOTALS_2026_27 = {
  comparison2025: 72895,
  requested2026: 23750,
  dnsCopies: 1400,
  areaTotal: 23200,
  printerTotal: 25150,
} as const;

const sourceRow = (
  sourceRowNumber: number,
  label: string,
  comparison2025: number | '/' | null,
  requested2026: number | '/' | null,
  dnsCopies: number | '/' | null,
  areaTotal2026: number | '/' | null,
  printerTotal2026: number | '/' | null,
  backLanguageNote: string,
  rowKind: PocketfolderSourceRow['rowKind'],
): PocketfolderSourceRow => ({
  id: `${POCKETFOLDER_SETUP_SEASON_ID}__source-row-${String(sourceRowNumber).padStart(2, '0')}`,
  seasonId: POCKETFOLDER_SETUP_SEASON_ID,
  sourceRow: sourceRowNumber,
  label,
  comparison2025,
  requested2026,
  dnsCopies,
  areaTotal2026,
  printerTotal2026,
  backLanguageNote,
  rowKind,
  provenance: {
    sourceSystem: 'legacy-sheet',
    sourceRecordId: `${POCKETFOLDER_SOURCE_FILE} / Folder-Brochure row ${sourceRowNumber}`,
    methodVersion: 1,
    dataStatus: 'draft',
  },
});

export const POCKETFOLDER_SOURCE_ROWS_2026_27: readonly PocketfolderSourceRow[] = [
  sourceRow(6, 'Antholzertal', 3500, 3000, 100, 4200, 4550, 'Rückseite dt-it-en', 'area'),
  sourceRow(7, 'Biathlonzentrum', 0, 1000, 100, '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(8, 'Für Gsieser Tal', 300, 300, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(9, 'für TV Innichen', 50, 0, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(10, 'für TV Toblach', 100, 50, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(11, 'für TV Niederdorf', 100, null, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(12, 'für TV Pragsertal', 100, 0, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(13, 'Für Osttirol', 100, null, '/', '/', null, '', 'distribution'),

  sourceRow(14, 'Gsieser Tal-Welsberg-Taisten', 3000, 5000, 200, 5200, 5500, 'Rückseite dt-it-en', 'area'),
  sourceRow(15, 'Für Osttirol', 100, null, null, null, null, '', 'distribution'),
  sourceRow(16, 'für TV Antholzertal', 100, 200, '/', '/', null, '', 'distribution'),
  sourceRow(17, 'für TV innichen', 50, 0, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(18, 'für TV Toblach', 100, 100, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(19, 'für TV Niederdorf', 200, null, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(20, 'für TV Pragsertal', 300, 0, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),

  sourceRow(21, '3 Zinnen Dolomites', 19400, null, 200, 11200, 12100, 'Rückseite dt-it-en', 'area'),
  sourceRow(22, 'Toblach', 7500, 2000, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(23, 'Sexten', 6000, 6000, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(24, 'Innichen', 5000, 3000, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(25, 'Pragsertal', 2000, 0, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(26, 'Niederdorf', 1600, null, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(27, 'für TV Antholzertal', null, 200, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(28, 'für Gsieser Tal', 500, 700, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(29, 'für Osttirol', 100, null, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),

  sourceRow(30, 'Osttirol', 7000, null, 200, 200, 250, 'Rückseite dt-it-en', 'area'),
  sourceRow(31, 'für TV Innichen', 50, 0, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(32, 'für TV Toblach', 100, 50, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(33, 'für TV Pragsertal', 50, 0, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(34, 'für TV Niederdorf', 20, null, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),

  sourceRow(35, 'Comelico', 1500, 1800, 200, 2000, 2000, 'retro it-dt-en', 'area'),
  sourceRow(36, '', null, null, null, null, null, '', 'blank'),
  sourceRow(37, 'Cortina', 0, null, 0, 0, 200, 'retro it-dt-en', 'area'),
  sourceRow(38, 'für TV Gsiesertal', 50, 50, '/', '/', null, 'retro it-dt-en', 'distribution'),
  sourceRow(39, 'für TV Antholzertal', 50, 100, '/', '/', null, 'retro it-dt-en', 'distribution'),
  sourceRow(40, 'für-per TV Innichen San Candido', 50, 0, '/', '/', null, 'retro it-dt-en', 'distribution'),
  sourceRow(41, 'für-per TV Toblach Dobbiaco', 100, 50, '/', '/', null, 'retro it-dt-en', 'distribution'),
  sourceRow(42, 'für-per TV Pragsertal', 50, 0, '/', '/', null, 'retro it-dt-en', 'distribution'),
  sourceRow(43, 'für-per TV Niederdorf Villabassa', 25, null, '/', '/', null, 'retro it-dt-en', 'distribution'),

  sourceRow(44, 'TV AHRNTAL', 3750, null, 100, 200, 350, 'Rückseite dt-it-en', 'area'),
  sourceRow(45, 'TV Sand in Taufers', 3750, null, 100, '/', null, 'Rückseite dt-it-en', 'area'),
  sourceRow(46, 'fur TV Gsiesertal', 50, 50, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(47, 'für TV Antholzertal', 50, 100, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),
  sourceRow(48, 'für Pragsertal', 50, 0, '/', '/', null, 'Rückseite dt-it-en', 'distribution'),

  sourceRow(49, 'Gröden', 1000, null, 100, 100, 200, 'Rückseite dt-it-en', 'area'),
  sourceRow(50, 'Seiser Alm', 5000, null, 100, 100, null, 'Rückseite dt-it-en', 'area'),
  sourceRow(51, 'TOTALE', 72895, 23750, 1400, 23200, 25150, '', 'total'),
  sourceRow(52, '', null, null, null, null, null, '', 'blank'),
  sourceRow(53, '*jeweils 200 Stück für die Verteilung (Lieferung direkt an DNS Büro)', null, null, null, null, null, '', 'note'),
  sourceRow(54, '* 200 x per la distribuzione (consegna ufficio DNS a Monguelfo)', null, null, null, null, null, '', 'note'),
] as const;

const provenance = (row: number) => ({
  sourceSystem: 'legacy-sheet' as const,
  sourceRecordId: `${POCKETFOLDER_SOURCE_FILE} / Lieferadressen-Indirizzi di con!A${row}:F${row}`,
  methodVersion: 1,
  dataStatus: 'draft' as const,
});

export const DELIVERY_LOCATIONS_2026_27: readonly DeliveryLocation[] = [
  { id: 'delivery-biathlon-antholz', organizationId: 'biathlon-antholz', reportingAreaId: 'antholzertal', label: 'Biathlonzentrum Antholz', contactName: 'Erika Pallhuber', recipientName: 'Biathlonzentrum Antholz', addressLine1: 'Obertalerstrasse, 33', postalLocality: '39030 Rasen Antholz', phone: '0474 492390', status: 'verified', provenance: provenance(2) },
  { id: 'delivery-antholzertal-tv', organizationId: 'antholzertal', reportingAreaId: 'antholzertal', label: 'TV Antholzertal', contactName: 'Carmen Aichner', recipientName: 'TV Antholzertal', addressLine1: 'Niederrasner Str. 35/F', postalLocality: '39030 Rasen Antholz', phone: '0474 496269', status: 'verified', provenance: provenance(3) },
  { id: 'delivery-gsies-welsberg', organizationId: 'gsiesertal-welsberg-taisten', reportingAreaId: 'gsiesertal-welsberg-taisten', label: 'TV Welsberg', contactName: 'Andrea Schwingshackl', recipientName: 'TV Welsberg', addressLine1: 'Pustertaler Straße 16', postalLocality: 'Welsberg', phone: '0474 978436', status: 'verified', provenance: provenance(4) },
  { id: 'delivery-tv-sexten', organizationId: 'tv-sexten', reportingAreaId: 'drei-zinnen', label: 'TV Sexten', contactName: 'Annemarie Summerer', recipientName: 'TV Sexten', addressLine1: 'Dolomitenstraße 45 A', postalLocality: '39030 Sexten', phone: '0474 710310', status: 'verified', provenance: provenance(5) },
  { id: 'delivery-tv-innichen', organizationId: 'tv-innichen', reportingAreaId: 'drei-zinnen', label: 'TV Innichen', contactName: 'Caroline Schäfer', recipientName: 'TV Innichen', addressLine1: 'Lieferadresse telefonisch abklären (Pflegplatz 1 oder Handwerkerzone 2)', postalLocality: '39038 Innichen', phone: '0474 913149', status: 'needs-confirmation', provenance: provenance(6), notes: 'Delivery address must be confirmed by phone before supplier dispatch.' },
  { id: 'delivery-tv-toblach', organizationId: 'tv-toblach', reportingAreaId: 'drei-zinnen', label: 'TV Toblach', contactName: 'Jasmina Pattis', recipientName: 'TV Toblach', addressLine1: 'Dolomitenstraße 3', postalLocality: '39034 Toblach', phone: '0474 972132', status: 'verified', provenance: provenance(7) },
  { id: 'delivery-tv-niederdorf', organizationId: 'tv-niederdorf', reportingAreaId: 'drei-zinnen', label: 'TV Niederdorf', contactName: 'Simona Tschurtschenthaler', recipientName: 'TV Niederdorf', addressLine1: 'Bahnhofstraße 3', postalLocality: '39039 Niederdorf', phone: '0474 745136', status: 'verified', provenance: provenance(8) },
  { id: 'delivery-tv-prags', organizationId: 'tv-prags', reportingAreaId: 'drei-zinnen', label: 'TV Prags', contactName: 'Rosa Watschinger', recipientName: 'TV Prags', addressLine1: 'Außerprags 78', postalLocality: '39030 Prags', phone: '0474 748660', status: 'verified', provenance: provenance(9) },
  { id: 'delivery-osttirol', organizationId: 'tvb-osttirol', reportingAreaId: 'osttirol', label: 'Tourismusinformation Hochpustertal', contactName: 'Otto Trauner', recipientName: 'Tourismusinformation Hochpustertal', addressLine1: 'Gemeindehaus 86', postalLocality: 'A-9920 Sillian', phone: '0043.50.212.300', status: 'verified', provenance: provenance(10) },
  { id: 'delivery-comelico', organizationId: 'val-comelico', reportingAreaId: 'val-comelico', label: 'Unione Montana Comelico', contactName: 'Livio Olivotto', recipientName: 'Unione Montana Comelico', addressLine1: 'Via Dante Alighieri 3', postalLocality: 'Santo Stefano di Cardore', phone: '3204307138 Mo-Fr 08:00-12:30', status: 'verified', provenance: provenance(11) },
  { id: 'delivery-cortina', organizationId: 'servizi-ampezzo', reportingAreaId: 'cortina-d-ampezzo', label: 'SEAM Cortina', contactName: 'Massimo Siorpaes', recipientName: 'SEAM Cortina', addressLine1: 'Fiames Centro Nordico', postalLocality: "32043 Cortina d'Ampezzo", phone: '331 4000190', status: 'verified', provenance: provenance(12) },
  { id: 'delivery-auronzo', label: 'Comune di Auronzo', contactName: 'Nicola Bambassei', recipientName: 'Comune di Auronzo', status: 'incomplete', provenance: provenance(13), notes: 'Address and phone are blank in the source workbook.' },
  { id: 'delivery-sand-in-taufers', organizationId: 'sand-in-taufers', reportingAreaId: 'ahrntal', label: 'Tourismusverein Sand in Taufers', contactName: 'Alexa Nöckler', recipientName: 'Tourismusverein Sand in Taufers', addressLine1: 'Jungmannstr. 8', postalLocality: '39023 Sand in Taufers', phone: '0474 678076', status: 'verified', provenance: provenance(14) },
  { id: 'delivery-ahrntal', organizationId: 'ahrntal', reportingAreaId: 'ahrntal', label: 'Tourismusverein Ahrntal', contactName: 'Barbara Griessmair', recipientName: 'Tourismusverein Ahrntal', addressLine1: 'Ahrner Straße 22', postalLocality: '39030 Luttach/ Ahrntal', phone: '0474 671136', status: 'verified', provenance: provenance(15) },
  { id: 'delivery-val-gardena', organizationId: 'val-gardena', reportingAreaId: 'seiser-alm-dolomites-val-gardena', label: 'Tourismusverein St. Christina', contactName: 'Katrin Perathoner', recipientName: 'Tourismusverein St. Christina', addressLine1: 'Str. Chemun 9', postalLocality: '39047 St. Christina', phone: '0471 777800', status: 'verified', provenance: provenance(16) },
  { id: 'delivery-seiser-alm', organizationId: 'seiser-alm-marketing', reportingAreaId: 'seiser-alm-dolomites-val-gardena', label: 'Verschönerungsverein Ferienregion Seiser Alm', contactName: 'Martin Rabensteiner', recipientName: 'Verschönerungsverein Ferienregion Seiser Alm', addressLine1: 'Dorfstraße 15', postalLocality: 'I-39050 Völs am Schlern', phone: '0471 709600', status: 'verified', provenance: provenance(17) },
  { id: 'delivery-dns-office', organizationId: 'dolomiti-nordicski', label: 'DNS Büro', contactName: 'Alberto Comini', recipientName: 'DNS Büro', addressLine1: 'Bahnhofstraße 29', postalLocality: '39039 Welsberg', status: 'verified', provenance: provenance(18) },
  { id: 'delivery-dns-mailingwerkstatt', organizationId: 'dolomiti-nordicski', label: 'GAS Mailingwerkstatt GmbH', contactName: 'GAS Mailingwerkstatt GmbH', recipientName: 'Tagespost "Dolomiti Nordicski" z.H. Frau Vicky Sax', addressLine1: 'Wagnergraben 1', postalLocality: '5152 Michaelbeuern - Österreich', status: 'verified', provenance: provenance(19) },
] as const;
