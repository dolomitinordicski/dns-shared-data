export const DNS_PRINT_PROFILES_VERSION = '1.0.0' as const;

export const DNS_PRINT_PROFILE_IDS = [
  'operational-table',
  'report',
  'document',
] as const;

export type DNSPrintProfileId = (typeof DNS_PRINT_PROFILE_IDS)[number];

export interface DNSPrintProfile {
  id: DNSPrintProfileId;
  label: string;
  purpose: string;
  pageSize: 'A4';
  orientation: 'portrait' | 'landscape';
  marginMm: number;
  contentMode: 'active-table-only' | 'document-flow' | 'form-document';
  logoFile: string;
  logoHeightMm: number;
  header: {
    compact: boolean;
    showLogo: boolean;
    showTitle: boolean;
    showSeason: boolean;
    showGeneratedAt: boolean;
    showMetadata: boolean;
    dividerWidthMm: number;
    dividerColor: string;
    marginBottomMm: number;
  };
  typography: {
    titleSizePt: number;
    metaSizePt: number;
    bodySizePt: number;
    tableHeaderSizePt: number;
    tableBodySizePt: number;
    totalSizePt: number;
    lineHeight: number;
  };
  table: {
    borderColor: string;
    headerBackground: string;
    headerTextColor: string;
    bodyTextColor: string;
    totalBackground: string;
    totalTextColor: string;
    cellPaddingMmX: number;
    cellPaddingMmY: number;
    repeatHeaderOnPageBreak: boolean;
    avoidRowBreaks: boolean;
    useTabularNumbers: boolean;
  };
  visibility: {
    hideNavigation: boolean;
    hideControls: boolean;
    hideFooter: boolean;
    hidePublicShareControls: boolean;
    printActiveTableOnly: boolean;
  };
  supports: readonly string[];
  rules: readonly string[];
}

const sharedTable = {
  borderColor: '#B8C9CE',
  headerBackground: '#F4F8F9',
  headerTextColor: '#0D4D5E',
  bodyTextColor: '#0D4D5E',
  totalBackground: '#0D4D5E',
  totalTextColor: '#FFFFFF',
  cellPaddingMmX: 1.2,
  cellPaddingMmY: 1.0,
  repeatHeaderOnPageBreak: true,
  avoidRowBreaks: true,
  useTabularNumbers: true,
} as const;

export const DNS_PRINT_PROFILES: Readonly<Record<DNSPrintProfileId, DNSPrintProfile>> = {
  'operational-table': {
    id: 'operational-table',
    label: 'Operational Table',
    purpose: 'Dense operational tables such as FAIR, Faktura and Data Entry exports.',
    pageSize: 'A4',
    orientation: 'landscape',
    marginMm: 8,
    contentMode: 'active-table-only',
    logoFile: 'logo.png',
    logoHeightMm: 10,
    header: {
      compact: true,
      showLogo: true,
      showTitle: true,
      showSeason: true,
      showGeneratedAt: true,
      showMetadata: true,
      dividerWidthMm: 0.3,
      dividerColor: '#AAD0D1',
      marginBottomMm: 4,
    },
    typography: {
      titleSizePt: 11,
      metaSizePt: 7,
      bodySizePt: 7,
      tableHeaderSizePt: 6.5,
      tableBodySizePt: 6.5,
      totalSizePt: 7,
      lineHeight: 1.15,
    },
    table: sharedTable,
    visibility: {
      hideNavigation: true,
      hideControls: true,
      hideFooter: true,
      hidePublicShareControls: true,
      printActiveTableOnly: true,
    },
    supports: ['dense-tables', 'season-meta', 'region-logo', 'totals', 'legends'],
    rules: [
      'Use for operational data where table density is primary.',
      'Render only the active printable table/document sheet.',
      'Repeat table headers and avoid row breaks where possible.',
    ],
  },

  report: {
    id: 'report',
    label: 'Report',
    purpose: 'Management and analytical reports with sections, narrative copy, charts/tables and sources.',
    pageSize: 'A4',
    orientation: 'portrait',
    marginMm: 14,
    contentMode: 'document-flow',
    logoFile: 'logo.png',
    logoHeightMm: 11,
    header: {
      compact: false,
      showLogo: true,
      showTitle: true,
      showSeason: true,
      showGeneratedAt: true,
      showMetadata: true,
      dividerWidthMm: 0.3,
      dividerColor: '#AAD0D1',
      marginBottomMm: 6,
    },
    typography: {
      titleSizePt: 16,
      metaSizePt: 8,
      bodySizePt: 9.5,
      tableHeaderSizePt: 7,
      tableBodySizePt: 7.5,
      totalSizePt: 8,
      lineHeight: 1.35,
    },
    table: {
      ...sharedTable,
      cellPaddingMmX: 1.6,
      cellPaddingMmY: 1.4,
    },
    visibility: {
      hideNavigation: true,
      hideControls: true,
      hideFooter: true,
      hidePublicShareControls: true,
      printActiveTableOnly: false,
    },
    supports: ['sections', 'narrative-copy', 'charts', 'tables', 'sources', 'methodology', 'page-breaks'],
    rules: [
      'Use for reports whose hierarchy is document-first rather than table-first.',
      'Narrative copy, methodology and sources remain visible when part of the report.',
      'Sections may opt into explicit page breaks through Foundation print classes.',
    ],
  },

  document: {
    id: 'document',
    label: 'Document',
    purpose: 'Formal forms, confirmations, order documents and Partner Portal-generated documents.',
    pageSize: 'A4',
    orientation: 'portrait',
    marginMm: 16,
    contentMode: 'form-document',
    logoFile: 'logo.png',
    logoHeightMm: 12,
    header: {
      compact: false,
      showLogo: true,
      showTitle: true,
      showSeason: false,
      showGeneratedAt: true,
      showMetadata: true,
      dividerWidthMm: 0.3,
      dividerColor: '#AAD0D1',
      marginBottomMm: 7,
    },
    typography: {
      titleSizePt: 15,
      metaSizePt: 8,
      bodySizePt: 10,
      tableHeaderSizePt: 8,
      tableBodySizePt: 8.5,
      totalSizePt: 9,
      lineHeight: 1.4,
    },
    table: {
      ...sharedTable,
      cellPaddingMmX: 1.8,
      cellPaddingMmY: 1.6,
    },
    visibility: {
      hideNavigation: true,
      hideControls: true,
      hideFooter: true,
      hidePublicShareControls: true,
      printActiveTableOnly: false,
    },
    supports: ['formal-document', 'recipient-meta', 'confirmation', 'signature-area', 'tables', 'notes'],
    rules: [
      'Use for transactional/formal documents such as order confirmations.',
      'Document content language may differ from UI language according to F0.5.',
      'Official accounting documents remain outside DNS when XGLA4 is authoritative.',
    ],
  },
} as const;

export function getDNSPrintProfile(id: DNSPrintProfileId = 'operational-table'): DNSPrintProfile {
  return DNS_PRINT_PROFILES[id] ?? DNS_PRINT_PROFILES['operational-table'];
}

export function isDNSPrintProfileId(value: unknown): value is DNSPrintProfileId {
  return typeof value === 'string' && (DNS_PRINT_PROFILE_IDS as readonly string[]).includes(value);
}

export const DNS_CREATIVE_EXPORT_BOUNDARY = {
  id: 'creative-export',
  foundationPrintProfile: false,
  owner: 'tool',
  appliesTo: ['Flyer Studio', 'creative canvas export'],
  rule:
    'Creative export is produced by the authoring engine. Foundation governs editor UI/export controls, not the rendered creative artifact.',
} as const;
