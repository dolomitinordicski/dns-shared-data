import {
  DNS_CAPABILITIES,
  type DNSCapabilityId,
} from './capabilities.js';
import type { DNSPrintProfileId } from './print-profiles.js';

export type DNSCapabilityStatus = 'idle' | 'running' | 'success' | 'error' | 'unavailable';

export interface DNSCapabilityContext {
  capability: DNSCapabilityId;
  language?: 'de' | 'it';
  signal?: AbortSignal;
}

export interface DNSCapabilityAdapter<TInput = unknown, TOutput = unknown> {
  id: string;
  capabilities: readonly DNSCapabilityId[];
  execute(input: TInput, context: DNSCapabilityContext): Promise<TOutput> | TOutput;
}

export interface DNSCapabilityRunResult<T = unknown> {
  capability: DNSCapabilityId;
  adapterId: string;
  output: T;
}

export interface DNSCapabilityRuntimeOptions {
  declared?: readonly DNSCapabilityId[];
  adapters?: readonly DNSCapabilityAdapter[];
  printNow?: (profile?: DNSPrintProfileId) => void;
  language?: 'de' | 'it';
}

export interface DNSCapabilityRuntime {
  readonly declared: readonly DNSCapabilityId[];
  listAvailable(): DNSCapabilityId[];
  has(capability: DNSCapabilityId): boolean;
  register(adapter: DNSCapabilityAdapter): void;
  run<T = unknown>(capability: DNSCapabilityId, input?: unknown): Promise<DNSCapabilityRunResult<T>>;
}

function quoteCSV(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n;]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function rowsToCSV(input: any) {
  const rows = Array.isArray(input?.rows) ? input.rows : [];
  const explicitColumns = Array.isArray(input?.columns) ? input.columns : null;
  const columns = explicitColumns ?? Array.from(
    rows.reduce((set: Set<string>, row: Record<string, unknown>) => {
      Object.keys(row ?? {}).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );
  const delimiter = input?.delimiter ?? ',';
  const header = columns.map(quoteCSV).join(delimiter);
  const body = rows.map((row: Record<string, unknown>) =>
    columns.map((column: string) => quoteCSV(row?.[column])).join(delimiter),
  );
  return [header, ...body].join('\r\n');
}

function parseCSV(text: string, delimiter = ',') {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && char === delimiter) {
      row.push(cell);
      cell = '';
      continue;
    }
    if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value !== '')) rows.push(row);

  const [headers = [], ...data] = rows;
  return data.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  );
}

function downloadText(filename: string, text: string, mimeType: string) {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    return { filename, text, mimeType };
  }
  const blob = new Blob([text], { type: mimeType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  queueMicrotask(() => URL.revokeObjectURL(href));
  return { filename, mimeType, size: blob.size };
}

function escapeICS(value: unknown) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toICSDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function eventsToICS(input: any) {
  const events = Array.isArray(input?.events) ? input.events : [];
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dolomiti NordicSki//DNS Foundation//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + escapeICS(event.uid ?? (crypto?.randomUUID?.() ?? Date.now().toString())));
    lines.push('DTSTAMP:' + toICSDate(new Date()));
    if (event.start) lines.push('DTSTART:' + toICSDate(event.start));
    if (event.end) lines.push('DTEND:' + toICSDate(event.end));
    if (event.summary) lines.push('SUMMARY:' + escapeICS(event.summary));
    if (event.description) lines.push('DESCRIPTION:' + escapeICS(event.description));
    if (event.location) lines.push('LOCATION:' + escapeICS(event.location));
    if (event.url) lines.push('URL:' + escapeICS(event.url));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function nativeAdapter(printNow?: DNSCapabilityRuntimeOptions['printNow']): DNSCapabilityAdapter {
  return {
    id: 'dns-foundation-native',
    capabilities: ['export.csv','export.json','import.csv','import.json','calendar.ics','clipboard.copy','print'],
    async execute(input: any, context) {
      switch (context.capability) {
        case 'export.csv': {
          const rawText = typeof input?.text === 'string' ? input.text : rowsToCSV(input);
          const includeBom = input?.bom !== false;
          const text = includeBom && !rawText.startsWith('\uFEFF')
            ? '\uFEFF' + rawText
            : rawText;
          return downloadText(
            input?.filename ?? 'export.csv',
            text,
            input?.mimeType ?? 'text/csv;charset=utf-8',
          );
        }
        case 'export.json': {
          const text = JSON.stringify(input?.data ?? input ?? null, null, input?.pretty === false ? 0 : 2);
          return downloadText(input?.filename ?? 'export.json', text, 'application/json;charset=utf-8');
        }
        case 'import.csv': {
          const text = typeof input?.text === 'string'
            ? input.text
            : input?.file && typeof input.file.text === 'function'
              ? await input.file.text()
              : '';
          return parseCSV(text.replace(/^\uFEFF/, ''), input?.delimiter ?? ',');
        }
        case 'import.json': {
          const text = typeof input?.text === 'string'
            ? input.text
            : input?.file && typeof input.file.text === 'function'
              ? await input.file.text()
              : '';
          return JSON.parse(text);
        }
        case 'calendar.ics': {
          const text = eventsToICS(input);
          return downloadText(input?.filename ?? 'event.ics', text, 'text/calendar;charset=utf-8');
        }
        case 'clipboard.copy': {
          const text = String(input?.text ?? '');
          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return { copied: true };
          }
          return { copied: false, text };
        }
        case 'print': {
          printNow?.(input?.profile);
          return { printed: true, profile: input?.profile };
        }
        default:
          throw new Error('Unsupported native DNS capability: ' + context.capability);
      }
    },
  };
}

export function createDNSCapabilityRuntime(
  options: DNSCapabilityRuntimeOptions = {},
): DNSCapabilityRuntime {
  const declared = [...new Set(options.declared ?? [])];
  const adapters = new Map<DNSCapabilityId, DNSCapabilityAdapter>();

  const register = (adapter: DNSCapabilityAdapter) => {
    for (const capability of adapter.capabilities) adapters.set(capability, adapter);
  };

  register(nativeAdapter(options.printNow));
  for (const adapter of options.adapters ?? []) register(adapter);

  return {
    declared,
    listAvailable() {
      return declared.filter((capability) => adapters.has(capability));
    },
    has(capability) {
      return declared.includes(capability) && adapters.has(capability);
    },
    register,
    async run<T = unknown>(capability: DNSCapabilityId, input?: unknown) {
      if (!declared.includes(capability)) {
        throw new Error('DNS capability not declared by consumer: ' + capability);
      }
      const adapter = adapters.get(capability);
      if (!adapter) {
        const definition = DNS_CAPABILITIES[capability];
        throw new Error(
          'DNS capability adapter unavailable for ' + capability +
          ' (' + definition.implementation + ')',
        );
      }
      const output = await adapter.execute(input, {
        capability,
        language: options.language,
      });
      return { capability, adapterId: adapter.id, output: output as T };
    },
  };
}
