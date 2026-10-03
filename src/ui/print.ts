import { DNS_DESIGN_SYSTEM } from '../design-system.js';
import { getDNSPrintProfile, type DNSPrintProfile, type DNSPrintProfileId } from '../print-profiles.js';

type WidenToken<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends readonly (infer U)[] ? readonly WidenToken<U>[] :
  T extends object ? { [K in keyof T]: WidenToken<T[K]> } :
  T;

export type DNSPrintTokens = WidenToken<typeof DNS_DESIGN_SYSTEM.print>;

export interface DNSPrintRuntimeOptions {
  root?: Document;
  /**
   * Canonical F3 print profile. Preferred for new consumers.
   */
  profile?: DNSPrintProfileId;
  /**
   * Legacy token override kept only for migration compatibility.
   */
  print?: DNSPrintTokens;
}

export interface DNSPrintRuntimeHandle {
  getProfile(): DNSPrintProfileId | 'legacy';
  setProfile(profile: DNSPrintProfileId): void;
  printNow(profile?: DNSPrintProfileId): void;
  disconnect(): void;
}


type RuntimePrintShape = {
  pageSize: string;
  orientation: string;
  marginMm: number;
  logoHeightMm: number;
  header: {
    marginBottomMm: number;
    dividerWidthMm: number;
    dividerColor: string;
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
};

function fromProfile(profile: DNSPrintProfile): RuntimePrintShape {
  return {
    pageSize: profile.pageSize,
    orientation: profile.orientation,
    marginMm: profile.marginMm,
    logoHeightMm: profile.logoHeightMm,
    header: {
      marginBottomMm: profile.header.marginBottomMm,
      dividerWidthMm: profile.header.dividerWidthMm,
      dividerColor: profile.header.dividerColor,
    },
    typography: profile.typography,
    table: profile.table,
  };
}

function fromLegacy(print: DNSPrintTokens): RuntimePrintShape {
  return {
    pageSize: print.pageSize,
    orientation: print.orientation,
    marginMm: print.marginMm,
    logoHeightMm: print.logoHeightMm,
    header: {
      marginBottomMm: print.header.marginBottomMm,
      dividerWidthMm: print.header.dividerWidthMm,
      dividerColor: print.header.dividerColor,
    },
    typography: {
      titleSizePt: print.typography.titleSizePt,
      metaSizePt: print.typography.metaSizePt,
      bodySizePt: 8,
      tableHeaderSizePt: print.typography.tableHeaderSizePt,
      tableBodySizePt: print.typography.tableBodySizePt,
      totalSizePt: print.typography.totalSizePt,
      lineHeight: print.typography.lineHeight,
    },
    table: print.table,
  };
}

const STYLE_ID = 'dns-print-runtime-style';

function ensurePrintStyles(documentRoot: Document, print: RuntimePrintShape, profileId: DNSPrintProfileId | 'legacy') {
  let style = documentRoot.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = documentRoot.createElement('style');
    style.id = STYLE_ID;
    documentRoot.head.appendChild(style);
  }

  const p = print;
  const pageWidthMm = p.orientation === 'landscape' ? 297 : 210;
  const preflightWidthMm = Math.max(1, pageWidthMm - (p.marginMm * 2));
  style.textContent = `
.dns-print-sheet {
  display: block;
  position: fixed;
  top: 0;
  left: -200vw;
  width: ${preflightWidthMm}mm;
  max-width: none;
  margin: 0;
  padding: 0;
  visibility: hidden;
  pointer-events: none;
  overflow: visible;
  background: #fff;
}

@media print {
  @page {
    size: ${p.pageSize} ${p.orientation};
    margin: ${p.marginMm}mm;
  }

  html, body {
    width: auto !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }

  #root { display: none !important; }

  body > .dns-print-sheet {
    display: block !important;
    position: static !important;
    width: 100% !important;
    visibility: visible !important;
    pointer-events: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: ${p.table.bodyTextColor} !important;
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: ${p.typography.bodySizePt}pt;
    line-height: ${p.typography.lineHeight};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .dns-print-document-header {
    display: flex !important;
    align-items: center;
    gap: 5mm;
    margin: 0 0 ${p.header.marginBottomMm}mm;
    padding: 0 0 3mm;
    border-bottom: ${p.header.dividerWidthMm}mm solid ${p.header.dividerColor};
  }

  .dns-print-logo {
    width: auto;
    height: ${p.logoHeightMm}mm;
    object-fit: contain;
    flex: 0 0 auto;
  }

  .dns-print-title {
    margin: 0;
    font-size: ${p.typography.titleSizePt}pt;
    line-height: ${p.typography.lineHeight};
    font-weight: 700;
    color: ${p.table.headerTextColor};
  }

  .dns-print-meta {
    margin-top: .8mm;
    font-family: Roboto, sans-serif;
    font-size: ${p.typography.metaSizePt}pt;
    line-height: ${p.typography.lineHeight};
    color: #5A7F8A;
  }

  .dns-print-table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    ${p.table.useTabularNumbers ? 'font-variant-numeric: tabular-nums; font-feature-settings: "tnum";' : ''}
  }

  .dns-print-table thead { ${p.table.repeatHeaderOnPageBreak ? 'display: table-header-group;' : ''} }
  .dns-print-table tbody tr { ${p.table.avoidRowBreaks ? 'break-inside: avoid !important; page-break-inside: avoid !important;' : ''} }

  .dns-print-table th,
  .dns-print-table td {
    border: .2mm solid ${p.table.borderColor} !important;
    padding: ${p.table.cellPaddingMmY}mm ${p.table.cellPaddingMmX}mm !important;
    vertical-align: middle;
    line-height: ${p.typography.lineHeight} !important;
  }

  .dns-print-table th {
    font-size: ${p.typography.tableHeaderSizePt}pt !important;
    font-weight: 700;
    text-transform: uppercase;
    color: ${p.table.headerTextColor} !important;
    background: ${p.table.headerBackground} !important;
  }

  .dns-print-table td {
    font-size: ${p.typography.tableBodySizePt}pt !important;
    color: ${p.table.bodyTextColor} !important;
    background: #fff !important;
  }

  .dns-print-table tfoot th,
  .dns-print-table tfoot td {
    font-size: ${p.typography.totalSizePt}pt !important;
    font-weight: 700;
    color: ${p.table.totalTextColor} !important;
    background: ${p.table.totalBackground} !important;
  }

  .dns-print-number { text-align: right !important; }

  .dns-print-region-logo {
    width: auto;
    max-width: 24mm;
    height: 7mm;
    object-fit: contain;
    vertical-align: middle;
  }

  .dns-print-section {
    break-inside: avoid-page;
    margin: 0 0 6mm;
  }

  .dns-print-section-title {
    margin: 0 0 2.5mm;
    font-size: ${profileId === 'operational-table' ? p.typography.titleSizePt : Math.max(11, p.typography.titleSizePt - 2)}pt;
    line-height: 1.2;
    color: ${p.table.headerTextColor};
  }

  .dns-print-copy,
  .dns-print-methodology,
  .dns-print-source,
  .dns-print-note {
    font-size: ${p.typography.bodySizePt}pt;
    line-height: ${p.typography.lineHeight};
  }

  .dns-print-source,
  .dns-print-methodology {
    color: #5A7F8A;
  }

  .dns-print-page-break-before { break-before: page !important; page-break-before: always !important; }
  .dns-print-page-break-after { break-after: page !important; page-break-after: always !important; }
  .dns-print-avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }

  .dns-print-signature-area {
    margin-top: 12mm;
    min-height: 24mm;
    break-inside: avoid;
  }

  .dns-print-signature-line {
    display: block;
    width: 70mm;
    margin-top: 14mm;
    border-top: .2mm solid ${p.table.borderColor};
    padding-top: 1.5mm;
    font-size: ${p.typography.metaSizePt}pt;
    color: #5A7F8A;
  }

  html[data-dns-print-profile="report"] .dns-print-sheet {
    max-width: 100%;
  }

  html[data-dns-print-profile="document"] .dns-print-sheet {
    max-width: 100%;
  }
}
`;
}

export function initDNSPrintRuntime(
  options: DNSPrintRuntimeOptions = {},
): DNSPrintRuntimeHandle {
  const documentRoot =
    options.root ?? (typeof document !== 'undefined' ? document : undefined);

  if (!documentRoot || typeof window === 'undefined') {
    let profileId: DNSPrintProfileId | 'legacy' = options.profile ?? (options.print ? 'legacy' : 'operational-table');
    return {
      getProfile: () => profileId,
      setProfile(profile) { profileId = profile; },
      printNow(profile) { if (profile) profileId = profile; },
      disconnect() {},
    };
  }

  let profileId: DNSPrintProfileId | 'legacy' =
    options.profile ?? (options.print ? 'legacy' : 'operational-table');

  const applyProfile = (next: DNSPrintProfileId | 'legacy') => {
    profileId = next;
    const print =
      profileId === 'legacy'
        ? fromLegacy(options.print ?? DNS_DESIGN_SYSTEM.print)
        : fromProfile(getDNSPrintProfile(profileId));
    ensurePrintStyles(documentRoot, print, profileId);
    documentRoot.documentElement.dataset.dnsPrintProfile = profileId;
  };

  applyProfile(profileId);

  return {
    getProfile: () => profileId,
    setProfile(profile) {
      applyProfile(profile);
    },
    printNow(profile) {
      if (profile) applyProfile(profile);
      window.print();
    },
    disconnect() {
      documentRoot.getElementById(STYLE_ID)?.remove();
      delete documentRoot.documentElement.dataset.dnsPrintProfile;
    },
  };
}
