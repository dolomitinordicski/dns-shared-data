export const DNS_CAPABILITIES_VERSION = '1.0.0' as const;

export const DNS_CAPABILITY_IDS = [
  'export.csv',
  'export.xlsx',
  'export.pdf',
  'export.json',
  'export.zip',
  'export.bundle',
  'export.png',
  'export.jpeg',
  'export.svg',
  'import.csv',
  'import.xlsx',
  'import.json',
  'calendar.ics',
  'clipboard.copy',
  'qr.generate',
  'print',
] as const;

export type DNSCapabilityId = (typeof DNS_CAPABILITY_IDS)[number];

export type DNSCapabilityCategory =
  | 'export'
  | 'import'
  | 'calendar'
  | 'clipboard'
  | 'utility'
  | 'print';

export type DNSCapabilityImplementation = 'foundation-native' | 'adapter';

export interface DNSCapabilityDefinition {
  id: DNSCapabilityId;
  category: DNSCapabilityCategory;
  implementation: DNSCapabilityImplementation;
  labelKey: string;
  description: string;
  accepts: readonly string[];
  produces: readonly string[];
  rules: readonly string[];
}

export const DNS_CAPABILITIES: Readonly<Record<DNSCapabilityId, DNSCapabilityDefinition>> = {
  'export.csv': {
    id: 'export.csv',
    category: 'export',
    implementation: 'foundation-native',
    labelKey: 'capability.export.csv',
    description: 'Export tabular data as UTF-8 CSV.',
    accepts: ['rows', 'columns', 'filename'],
    produces: ['text/csv'],
    rules: ['Tool owns row/column selection; Foundation owns encoding and download mechanics.'],
  },
  'export.xlsx': {
    id: 'export.xlsx',
    category: 'export',
    implementation: 'adapter',
    labelKey: 'capability.export.xlsx',
    description: 'Export one or more sheets as XLSX.',
    accepts: ['workbook', 'filename'],
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    rules: ['Requires a registered XLSX adapter.'],
  },
  'export.pdf': {
    id: 'export.pdf',
    category: 'export',
    implementation: 'adapter',
    labelKey: 'capability.export.pdf',
    description: 'Generate a downloadable PDF file.',
    accepts: ['document', 'filename', 'profile'],
    produces: ['application/pdf'],
    rules: ['Requires a registered PDF adapter.', 'Foundation print profiles remain authoritative for shared DNS document geometry where applicable.'],
  },
  'export.json': {
    id: 'export.json',
    category: 'export',
    implementation: 'foundation-native',
    labelKey: 'capability.export.json',
    description: 'Export structured data as UTF-8 JSON.',
    accepts: ['data', 'filename', 'pretty'],
    produces: ['application/json'],
    rules: ['Tool owns data selection; Foundation owns serialization/download mechanics.'],
  },
  'export.zip': {
    id: 'export.zip',
    category: 'export',
    implementation: 'adapter',
    labelKey: 'capability.export.zip',
    description: 'Create a ZIP archive from multiple files.',
    accepts: ['files', 'filename'],
    produces: ['application/zip'],
    rules: ['Requires a registered ZIP adapter.'],
  },
  'export.bundle': {
    id: 'export.bundle',
    category: 'export',
    implementation: 'adapter',
    labelKey: 'capability.export.bundle',
    description: 'Create a governed multi-file export bundle.',
    accepts: ['artifacts', 'metadata', 'filename'],
    produces: ['application/zip'],
    rules: ['Requires a registered bundle/ZIP adapter.', 'Bundle contents remain tool-defined.'],
  },
  'export.png': {
    id: 'export.png',
    category: 'export',
    implementation: 'adapter',
    labelKey: 'capability.export.png',
    description: 'Render/export a PNG artifact.',
    accepts: ['source', 'filename'],
    produces: ['image/png'],
    rules: ['Requires a registered image-export adapter.'],
  },
  'export.jpeg': {
    id: 'export.jpeg',
    category: 'export',
    implementation: 'adapter',
    labelKey: 'capability.export.jpeg',
    description: 'Render/export a JPEG artifact.',
    accepts: ['source', 'filename', 'quality'],
    produces: ['image/jpeg'],
    rules: ['Requires a registered image-export adapter.'],
  },
  'export.svg': {
    id: 'export.svg',
    category: 'export',
    implementation: 'adapter',
    labelKey: 'capability.export.svg',
    description: 'Export a vector SVG artifact.',
    accepts: ['source', 'filename'],
    produces: ['image/svg+xml'],
    rules: ['Requires a registered SVG adapter when the tool cannot provide source SVG directly.'],
  },
  'import.csv': {
    id: 'import.csv',
    category: 'import',
    implementation: 'foundation-native',
    labelKey: 'capability.import.csv',
    description: 'Parse UTF-8 CSV input into rows.',
    accepts: ['file', 'text'],
    produces: ['rows'],
    rules: ['Foundation parses structure; tool validates domain meaning.'],
  },
  'import.xlsx': {
    id: 'import.xlsx',
    category: 'import',
    implementation: 'adapter',
    labelKey: 'capability.import.xlsx',
    description: 'Parse XLSX workbooks.',
    accepts: ['file', 'arrayBuffer'],
    produces: ['workbook'],
    rules: ['Requires a registered XLSX adapter.', 'Tool validates sheet/domain semantics.'],
  },
  'import.json': {
    id: 'import.json',
    category: 'import',
    implementation: 'foundation-native',
    labelKey: 'capability.import.json',
    description: 'Parse JSON input.',
    accepts: ['file', 'text'],
    produces: ['data'],
    rules: ['Foundation parses JSON; tool validates schema/domain semantics.'],
  },
  'calendar.ics': {
    id: 'calendar.ics',
    category: 'calendar',
    implementation: 'foundation-native',
    labelKey: 'capability.calendar.ics',
    description: 'Generate an iCalendar (.ics) file.',
    accepts: ['events', 'filename'],
    produces: ['text/calendar'],
    rules: ['Tool owns event content and recipients; Foundation owns file generation.'],
  },
  'clipboard.copy': {
    id: 'clipboard.copy',
    category: 'clipboard',
    implementation: 'foundation-native',
    labelKey: 'capability.clipboard.copy',
    description: 'Copy plain text to the system clipboard.',
    accepts: ['text'],
    produces: ['clipboard'],
    rules: ['Use only after an explicit user action.'],
  },
  'qr.generate': {
    id: 'qr.generate',
    category: 'utility',
    implementation: 'adapter',
    labelKey: 'capability.qr.generate',
    description: 'Generate a QR artifact from a URL/text payload.',
    accepts: ['value', 'format', 'size'],
    produces: ['svg', 'png'],
    rules: ['Requires a registered QR adapter.', 'Simple QR generation does not imply persistent campaign storage.'],
  },
  print: {
    id: 'print',
    category: 'print',
    implementation: 'foundation-native',
    labelKey: 'capability.print',
    description: 'Invoke Foundation/browser print flow.',
    accepts: ['profile'],
    produces: ['browser-print'],
    rules: ['Uses the F3 print runtime and canonical print profile semantics.'],
  },
} as const;

export const DNS_CAPABILITY_RULES = [
  'Tools declare only capabilities they actually expose.',
  'Foundation owns capability naming, status, common UI, loading/error/success semantics and adapter invocation.',
  'Tools own datasets, columns, validation, business meaning and workflow-specific payloads.',
  'Specialist libraries are registered behind adapters instead of being called directly from tool UI code.',
  'F9 may flag local implementations of governed capabilities once a consumer has migrated.',
  'A capability being declared does not grant authorization; access remains governed by the host application/platform.',
] as const;

export function isDNSCapabilityId(value: unknown): value is DNSCapabilityId {
  return typeof value === 'string' && (DNS_CAPABILITY_IDS as readonly string[]).includes(value);
}
