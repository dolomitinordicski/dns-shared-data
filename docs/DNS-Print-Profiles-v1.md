# DNS Print Profiles v1.0

**Status:** normative Foundation contract  
**Profiles:** Operational Table · Report · Document  
**Creative boundary:** Creative Export is not a Foundation print profile

## 1. Principle

DNS print output uses one shared print runtime with explicit document profiles.

Foundation owns:
- page geometry;
- print typography;
- DNS document header;
- table print behavior;
- print visibility rules;
- page-break helpers;
- common source/methodology/note treatment.

Tools own:
- document content;
- domain-specific values;
- calculations;
- business rules;
- which canonical print profile an artifact uses.

## 2. Operational Table

Use for dense operational data.

Typical consumers:
- FAIR;
- Faktura;
- Data Entry;
- operational exports.

Defaults:
- A4;
- landscape;
- 8 mm margins;
- active table/document sheet only;
- compact DNS header;
- dense table typography;
- repeated table headers;
- row-break avoidance;
- tabular numbers.

Use this profile when the table is the primary artifact.

## 3. Report

Use for management/analytical reports.

Typical consumers:
- Analytics reports;
- management summaries;
- Portal analytical/report documents.

Defaults:
- A4;
- portrait;
- 14 mm margins;
- document flow;
- larger title/body typography;
- narrative sections remain visible;
- methodology and sources remain printable;
- charts/tables may coexist in the same artifact.

Use this profile when reading hierarchy is more important than table density.

## 4. Document

Use for formal or transactional documents.

Typical consumers:
- order confirmations;
- delivery/confirmation documents;
- Partner Portal generated documents;
- formal forms/records.

Defaults:
- A4;
- portrait;
- 16 mm margins;
- formal document flow;
- recipient/metadata support;
- signature/confirmation area;
- tables and notes allowed.

Official invoices/accounting documents remain outside DNS where XGLA4 is authoritative.

## 5. Creative Export boundary

`creative-export` is explicitly **not** a Foundation print profile.

Flyer Studio may export:
- flyers;
- posters;
- social formats;
- creative PDFs/images.

Those exports are rendered by the Flyer authoring engine.

Foundation governs:
- editor shell;
- export controls;
- dialogs/forms;
- language/account/accessibility;
- asset selection UI.

Foundation does **not** govern:
- flyer canvas typography;
- flyer composition;
- creative color system;
- creative export rendering geometry.

Rule:

> Foundation governs the authoring environment, not the authored artifact.

## 6. Runtime use

Default:

```ts
initDNSFoundation({
  printProfile: 'operational-table',
});
```

Report:

```ts
initDNSFoundation({
  printProfile: 'report',
});
```

Document:

```ts
initDNSFoundation({
  printProfile: 'document',
});
```

A tool may choose a profile for a specific artifact:

```ts
foundation.printNow('report');
```

The print runtime may also switch profile directly:

```ts
printRuntime.setProfile('document');
```

## 7. Print portal rule

Printable content renders in:

```html
<div class="dns-print-sheet">...</div>
```

The print sheet must be mounted at body level, outside the application root when the application root is hidden for print.

The existing rule remains:

- no `window.open()` print copy;
- no `document.write()` print implementation;
- hidden application layout must not create phantom pages.

## 8. Shared print classes

Foundation supplies shared print semantics:

- `dns-print-sheet`
- `dns-print-document-header`
- `dns-print-logo`
- `dns-print-title`
- `dns-print-meta`
- `dns-print-table`
- `dns-print-number`
- `dns-print-region-logo`
- `dns-print-section`
- `dns-print-section-title`
- `dns-print-copy`
- `dns-print-methodology`
- `dns-print-source`
- `dns-print-note`
- `dns-print-page-break-before`
- `dns-print-page-break-after`
- `dns-print-avoid-break`
- `dns-print-signature-area`
- `dns-print-signature-line`

Tools may compose these classes but must not redefine shared page geometry.

## 9. Language

Print language follows the F0.5 localization contract.

Default:
- active UI language drives the artifact.

If the workflow defines a separate `contentLanguage`:
- explicit content language drives the generated document;
- UI language remains independent.

Examples:
- German UI → Italian order confirmation;
- Italian Portal UI → German report;
- bilingual document → DE+IT content while interface remains one language.

## 10. Generated-at and timezone

Generated timestamps use the Foundation operational timezone unless the domain requires another explicit IANA timezone.

Current operational default:

```text
Europe/Rome
```

An event/calendar workflow must use the actual event timezone where known.

## 11. Legacy compatibility

The old direct token object `DNS_DESIGN_SYSTEM.print` remains available temporarily so existing consumer repositories do not break before migration.

It is migration debt.

New code must select one of the canonical profiles.

During consumer consolidation:
1. identify each printable artifact;
2. assign `operational-table`, `report` or `document`;
3. remove local print geometry;
4. remove direct legacy token overrides;
5. retain tool-specific print content only.

## 12. Prohibited patterns

Foundation-aligned tools must not:
- invent local A4 margins/orientation for a shared document type;
- implement separate print CSS for common headers/tables;
- use browser popup/document-copy print implementations;
- treat Flyer creative export as an administrative print sheet;
- bind UI language and content language together when the workflow distinguishes them;
- render official invoice/accounting output inside DNS when XGLA4 remains authoritative.
