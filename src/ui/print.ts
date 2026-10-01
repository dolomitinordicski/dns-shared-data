import { DNS_DESIGN_SYSTEM } from '../design-system.js';

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
  print?: DNSPrintTokens;
}

export interface DNSPrintRuntimeHandle {
  printNow(): void;
  disconnect(): void;
}

const STYLE_ID = 'dns-print-runtime-style';

function ensurePrintStyles(documentRoot: Document, print: DNSPrintTokens) {
  let style = documentRoot.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = documentRoot.createElement('style');
    style.id = STYLE_ID;
    documentRoot.head.appendChild(style);
  }

  const p = print;
  style.textContent = `
.dns-print-sheet { display: none; }

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
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: ${p.table.bodyTextColor} !important;
    font-family: "Be Vietnam Pro", sans-serif;
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
}
`;
}

export function initDNSPrintRuntime(
  options: DNSPrintRuntimeOptions = {},
): DNSPrintRuntimeHandle {
  const documentRoot =
    options.root ?? (typeof document !== 'undefined' ? document : undefined);

  if (!documentRoot || typeof window === 'undefined') {
    return { printNow() {}, disconnect() {} };
  }

  const print = options.print ?? DNS_DESIGN_SYSTEM.print;
  ensurePrintStyles(documentRoot, print);

  return {
    printNow() {
      window.print();
    },
    disconnect() {
      documentRoot.getElementById(STYLE_ID)?.remove();
    },
  };
}
