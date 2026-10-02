# DNS Shared Capabilities Contract v1.0

**Foundation release:** 1.1.1  
**Status:** stable shared capability contract

## 1. Purpose

DNS tools must not independently reinvent common export/import and utility functions.

Foundation provides one capability registry and one invocation contract. Consumers declare only the capabilities they actually expose.

## 2. Governed capabilities

```text
export.csv
export.xlsx
export.pdf
export.json
export.zip
export.bundle
export.png
export.jpeg
export.svg
import.csv
import.xlsx
import.json
calendar.ics
clipboard.copy
qr.generate
print
```

## 3. Native vs adapters

Foundation-native:

```text
export.csv
export.json
import.csv
import.json
calendar.ics
clipboard.copy
print
```

Adapter-based:

```text
export.xlsx
export.pdf
export.zip
export.bundle
export.png
export.jpeg
export.svg
import.xlsx
qr.generate
```

Adapter-based means the host tool may use a specialized library, but it must register that implementation behind the shared Foundation capability API instead of calling it directly from local UI code.

## 4. Responsibility boundary

Foundation owns:
- capability IDs and labels;
- DE/IT labels;
- availability and UI state;
- adapter registration/invocation;
- common download/parse mechanics for native capabilities;
- shared action/menu styling.

Tool owns:
- which data is exported;
- optional pre-serialization when workflow-specific CSV layout cannot be expressed as generic rows/columns;
- columns/sheets/content;
- business validation;
- permissions;
- workflow-specific filenames/metadata;
- document content;
- creative source/rendering semantics.

## 5. Runtime

A consumer declares capabilities when initializing Foundation:

```ts
const foundation = initDNSFoundation({
  capabilities: [
    'export.csv',
    'export.xlsx',
    'export.pdf',
    'print',
  ],
  capabilityAdapters: [
    xlsxAdapter,
    pdfAdapter,
  ],
});
```

Then:

```ts
await foundation.capabilityRuntime.run('export.csv', {
  filename: 'daten.csv',
  rows,
});

// Workflow-specific CSV may also be pre-serialized by the tool while
// Foundation remains responsible for the governed download capability.
await foundation.capabilityRuntime.run('export.csv', {
  filename: 'nummerierung.csv',
  text: csvText,
  mimeType: 'text/csv;charset=utf-8',
});

await foundation.capabilityRuntime.run('export.xlsx', workbookPayload);
```

A declared adapter capability is unavailable until its adapter is registered.

## 6. Tool migration intent

Target examples:

```text
FAIR       → CSV / XLSX / PDF / Print
Analytics  → CSV / XLSX / PDF / Clipboard / Print
Polls      → CSV / ICS / Print
Data Entry → CSV / XLSX / CSV Import / XLSX Import
Faktura    → CSV / XLSX / PDF / Print
Portal     → PDF / XLSX / ZIP / ICS as workflow requires
Flyer      → PDF / PNG / JPEG / SVG / ZIP / QR
QR tool    → QR
```

This matrix is a migration target, not an automatic authorization grant.

## 7. Export bundle

`export.bundle` represents a governed multi-artifact package, for example:

```text
DNS-Export-2026-27.zip
├── report.pdf
├── data.xlsx
├── data.csv
└── metadata.json
```

The tool defines the content; Foundation governs the capability contract.

## 8. F9 relationship

F9 can flag local implementations of capabilities that a migrated consumer should source through Foundation.

Examples:
- local CSV serializer;
- local XLSX button/library invocation;
- local PDF generator entrypoint;
- independent ICS generator;
- duplicated QR utility.

F9 must not remove a specialist library that is legitimately used behind a registered Foundation adapter.
