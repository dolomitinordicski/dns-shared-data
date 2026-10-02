# DNS Consumer Migration Blueprint v1.0

**Foundation target:** 1.1.1  
**Status:** canonical migration pattern  
**Pilot validated on:** DNS Data Entry  
**Purpose:** define the repeatable F9 migration procedure for DNS consumer tools.

## 1. Scope

This blueprint governs migration of DNS consumer repositories onto a stable DNS Foundation release.

It applies to:
- FAIR;
- Analytics;
- Polls;
- Data Entry;
- Faktura/Billing;
- Partner Portal / Hub;
- Flyer Studio;
- QR Generator;
- future DNS tools.

It does **not** authorize changes to a tool's business engine, calculation logic, Firestore domain model, approved historical snapshots or accounting logic.

## 2. Core rule

A consumer migration must separate:

```text
business engine / domain logic
        ↓ unchanged
consumer integration layer
        ↓ migrated
DNS Foundation release
```

Foundation owns shared runtime, shell/UI behavior, common capabilities, shared contracts and governed assets.

The consumer continues to own domain-specific data, calculations, validation, permissions and workflow semantics.

## 3. Branch strategy

Every migration must use a dedicated branch from the latest stable consumer `main`.

Recommended naming:

```text
f9-foundation-adoption
f9-<step>-<purpose>
```

Procedure:
1. verify latest consumer `main`;
2. create migration branch from that exact SHA;
3. open a PR early;
4. keep `main` operational during the migration;
5. compare branch against `main` before merge;
6. remove obsolete local infrastructure only after replacement is validated;
7. merge only with green build/regression checks.

Large migrations should be split into independently mergeable steps.

## 4. Stable release pinning

Consumers must pin an immutable Foundation release.

Current F9 target:

```text
release/v1.1.1
```

Approved package form:

```json
"@dolomitinordicski/dns-shared-data":
  "github:dolomitinordicski/dns-shared-data#release/v1.1.1"
```

Do not use:
- Foundation `main`;
- `master`;
- mutable raw asset URLs under `main`;
- arbitrary commit SHAs as normal production dependencies;
- copied Foundation runtime code.

Shared static assets referenced directly by URL must also point to a stable release/versioned distribution.

## 5. Migration phases

### F9.1 — Dependency and capability audit

Identify:
- current Foundation dependency;
- local runtime/bootstrap code;
- local Design System fallbacks;
- shell/header/footer duplication;
- accessibility runtime duplication;
- print/export/import helpers;
- raw Foundation asset references;
- specialist libraries such as XLSX/PDF/ZIP/QR;
- business/domain code that must remain untouched.

Record what belongs to Foundation and what remains tool-owned.

### F9.2 — Foundation bootstrap

Replace fragmented shared-runtime startup with:

```ts
initDNSFoundation(...)
```

Configure only what the consumer actually needs:
- language;
- shell profile;
- capabilities;
- capability adapters;
- print profile;
- accessibility mount;
- optional workspace behavior.

Do not rewrite the consumer business engine while performing this step.

### F9.3 — Legacy cleanup

After the Foundation bootstrap builds successfully:
- remove unused local Design System fallback/runtime files;
- remove duplicated shared UI initialization;
- remove obsolete compatibility bridges;
- retain any local implementation that still owns legitimate domain behavior.

Deletion follows successful replacement, never precedes it.

### F9.4 — Regression and compliance consolidation

Verify:
- build;
- deploy;
- language behavior;
- shared shell/header/footer;
- accessibility;
- print;
- shared capabilities;
- stable asset references;
- no direct calls that bypass governed capability APIs;
- no business-engine regression.

Typical residual violations:
- `window.print()` instead of Foundation `print`;
- local CSV serializer/downloader instead of `export.csv`;
- XLSX/PDF/ZIP/QR invoked directly by UI instead of registered adapters;
- raw Foundation assets using `main`;
- local accessibility runtime in parallel with Foundation;
- copied shared tokens or runtime fallbacks.

### F9.5 — Migration evidence

A consumer is considered migrated only when the PR documents:
- Foundation release ref;
- declared capabilities;
- registered adapters;
- local shared-runtime files removed;
- business files intentionally left unchanged;
- build result;
- production deploy result where applicable.

## 6. Capability pattern

Declare only capabilities actually exposed by the tool.

Example:

```ts
const foundation = initDNSFoundation({
  language: 'de',
  shellProfile: 'operational',
  capabilities: [
    'export.csv',
    'export.xlsx',
    'print',
  ],
  capabilityAdapters: [
    xlsxAdapter,
  ],
});
```

Native capabilities should be invoked through Foundation.

Specialist libraries remain allowed, but behind adapters.

Correct:

```text
UI
 ↓
Foundation capability runtime
 ↓
XLSX adapter
 ↓
xlsx library
```

Incorrect:

```text
UI → xlsx.writeFile(...)
```

## 7. Adapter contract

An adapter should:
- implement one or more governed capability IDs;
- isolate the specialist library;
- contain no unrelated business logic;
- receive a tool-defined payload;
- return a predictable result;
- preserve Foundation availability/error semantics.

Example:

```ts
const xlsxAdapter = {
  id: 'dns-tool-xlsx',
  capabilities: ['export.xlsx'],
  execute(input) {
    // specialist XLSX implementation
  },
};
```

The consumer remains responsible for workbook content, column choice, validation and filenames.

## 8. Accessibility pattern

Foundation owns the accessibility runtime.

The React consumer should provide only the mount point when required:

```tsx
<div data-dns-accessibility-mount />
```

The consumer must not run a second independent accessibility runtime in parallel.

## 9. Asset pattern

Canonical DNS shared assets must be consumed from a stable Foundation release/versioned location.

Correct principle:

```text
consumer → Foundation release asset
```

Avoid:

```text
consumer → raw Foundation main
consumer → copied local canonical logo
```

Local assets remain valid only when they are genuinely tool-specific and not canonical DNS shared assets.

## 10. Consumer-owned code that must remain local

Do not migrate these into Foundation merely to reduce file count:
- calculation engines;
- FAIR formulas;
- order numbering/business rules;
- pricing logic;
- Firebase write semantics;
- permissions/business authorization;
- tool-specific tables and export contents;
- document contents;
- analytics methodology;
- domain validation;
- workflow-specific copy where not shared.

Shared infrastructure and domain logic must remain separate.

## 11. Regression checklist

Before merge, verify:

- [ ] branch started from latest stable `main`;
- [ ] consumer pins `release/v1.1.1`;
- [ ] no Foundation package dependency uses arbitrary SHA;
- [ ] no canonical Foundation asset points to raw `main`;
- [ ] `initDNSFoundation()` is the shared bootstrap;
- [ ] shared shell/UI runtime is not initialized twice;
- [ ] DE remains the default language and IT remains supported;
- [ ] accessibility has one owner;
- [ ] declared capabilities match actual UI actions;
- [ ] specialist libraries are behind adapters;
- [ ] print goes through Foundation;
- [ ] native shared capabilities do not use independent local infrastructure;
- [ ] obsolete shared-runtime files are removed;
- [ ] business/domain engine files were not changed unless explicitly required;
- [ ] build is green;
- [ ] deploy is green where applicable;
- [ ] branch is not behind `main` at merge time.

## 12. Pilot evidence — DNS Data Entry

DNS Data Entry validated this pattern in F9.

Migration outcome:
- old commit-SHA Foundation dependency replaced by `release/v1.1.1`;
- XLSX retained as specialist library behind Foundation adapter;
- fragmented local UI bootstrap replaced by `initDNSFoundation()`;
- local `designSystem.ts`, `uiRuntime.ts` and Design System fallback removed;
- CSV routed through governed capability runtime;
- print routed through Foundation;
- accessibility runtime consolidated under Foundation;
- brand and region-logo references pinned to stable Foundation release;
- business logic, Firestore logic, pricing, KP, sales, order calculations and ticket numbering left unchanged.

This pilot is the reference migration for subsequent consumers.

## 13. Recommended rollout order

Use this blueprint one consumer at a time.

Recommended sequence after the Data Entry pilot:

```text
FAIR
Polls
Analytics
Faktura / Billing
Partner Portal / Hub
QR Generator
Flyer Studio
```

For each tool:
1. audit;
2. migrate;
3. build;
4. compare;
5. clean up;
6. deploy;
7. only then start the next consumer.

## 14. Completion criterion

F9 is complete for a consumer when:

```text
stable Foundation release
+ single Foundation bootstrap
+ governed capabilities/adapters
+ stable shared assets
+ no obsolete shared-runtime duplication
+ green build/deploy
+ unchanged domain engine
```

The objective is not minimum file count.

The objective is one clear ownership model: **Foundation owns shared infrastructure; each tool owns its business domain.**
