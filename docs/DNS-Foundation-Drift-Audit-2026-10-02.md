# DNS Foundation Drift Audit — 2026-10-02

**Scope:** only DNS tools already touched during the current Foundation/design-system migration.

Included:
- DNS Shared Data
- DNS Data Entry
- DNS Analytics
- DNS FAIR
- DNS Faktura
- DNS Polls
- DNS Flyer Studio

Excluded:
- Partner Portal / Hub v2
- legacy Partner Portal
- QR / Smart Slopes / 360 AR / Strategy
- temporary DNS Hub launcher

**Reference:** DNS Foundation / Design System v1.18.0

## Audit rule

This audit distinguishes:

1. **Foundation-owned primitives** — should be shared and not independently redefined:
   header/chrome, navigation behavior, accessibility, buttons/actions, forms, tables, status/badges, app states, alerts, insights, notes/methodology/source, modal/confirm, toast, shared tokens.

2. **Application-owned UI** — may remain local:
   domain layouts, data visualisations, tool-specific editors, season logic, specialized widgets, print content selection, map/diagram geometry, chart semantics, flyer canvas/templates.

A local class is not drift simply because it exists. It is drift when it reimplements a semantic primitive already owned by Foundation.

---

## 1. DNS Shared Data
**Status:** reference consumer / low residual drift.

Already aligned:
- direct consumption of built canonical package from `dist/*`;
- Tool Chrome, Accessibility, Motion, Interaction and UI Primitives load from Foundation;
- Pages redeploys for all `src/**` changes;
- older DNS_Core design-system documents cannot downgrade the local package.

Residual drift:
- monolithic `index.html` still contains historical generic card/pill/tab/status CSS;
- these should gradually become reference-page layout classes rather than alternate primitives.

**Priority:** LOW.

## 2. DNS Data Entry
**Status:** strongly aligned / low-to-medium residual drift.

Residual drift:
- local fallback copy of core palette/tokens in `src/styles/index.css`;
- local `.dns-card` duplicates the Foundation card primitive;
- local `.dns-context-selector` predates the v1.18 toolbar/context-selector contract;
- generic table/form markup still partly uses tool-local composition.

Keep local:
- season selection behavior;
- Data Entry module layouts;
- order/KP/pricing-specific controls.

**Priority:** MEDIUM-LOW.

## 3. DNS Analytics
**Status:** aligned shell with visible primitive drift.

Residual drift:
- `.analytics-table` / `.analytics-table-wrap` duplicate Table v2;
- `.analytics-live-error` and runtime loading/error states overlap shared Alert/Application State;
- `.analytics-print-button` is a local action style;
- methodology/source blocks predate `dns-methodology` / `dns-source`;
- explanatory legacy blocks should use `dns-readable-copy`.

Keep local:
- charts;
- metrics/KPIs;
- analytical module layouts;
- diagnostic logic.

**Priority:** MEDIUM-HIGH.

## 4. DNS FAIR
**Status:** strong architecture alignment, clear primitive duplication.

Direct duplicates in local CSS:
- `.dns-note`
- `.dns-table-wrap`
- `.dns-table`
- `.dns-input`
- `.dns-btn`
- `.dns-btn-primary`
- `.dns-btn-secondary`

These are high-confidence cleanup candidates.

Keep local:
- FAIR-specific columns;
- region grouping;
- calculation behavior;
- FAIR totals and scoring semantics.

**Priority:** HIGH.

## 5. DNS Faktura
**Status:** Foundation-aligned functionality with substantial historical CSS duplication.

Residual drift:
- large local `:root` token block duplicates Foundation;
- local header/language/card/pill/navigation styles duplicate Foundation chrome;
- table and action styles still contain local conventions;
- error/status presentation is partly local;
- season-selector styling duplicates patterns found elsewhere.

Keep local:
- billing-run workflow;
- financial columns;
- provenance display;
- FAIR/IDM/orders/extras aggregation UI.

**Priority:** HIGH.

## 6. DNS Polls
**Status:** shared Foundation runtime present, action/form primitives still duplicated.

Local duplicates:
- `.dns-btn`
- `.dns-btn-primary`
- `.dns-btn-secondary`
- `.dns-input`
- `.dns-card`
- generic focus/disabled/touch rules already owned by Interaction/Accessibility.

Modal implementations should be normalized to `dns-modal` and the shared action hierarchy.

Keep local:
- poll/calendar matrix;
- recipient/privacy controls;
- finalization + ICS workflow.

**Priority:** MEDIUM-HIGH.

## 7. DNS Flyer Studio
**Status:** partial migration / highest drift in current scope.

Residual drift:
- legacy variables `--dns-primary`, `--dns-deep`, `--dns-teal`, `--dns-soft`;
- alternate palette semantics/backgrounds;
- dark-body application shell;
- local scrollbar and print conventions;
- Export/Saved Designs/Social Share modals remain local;
- Navbar/actions remain local;
- v1.18 primitive usage is still minimal.

Keep local:
- flyer canvas;
- templates/variants;
- editor layout;
- export rendering;
- creative typography inside generated flyers.

**Priority:** HIGHEST.

---

## Recommended cleanup order

1. FAIR
2. Polls
3. Analytics
4. Faktura
5. Data Entry
6. Flyer Studio
7. Shared Data residual reference-page CSS

## Migration safety rule

1. Do not change business/data logic.
2. Replace one semantic primitive family at a time.
3. Build/deploy after each family.
4. Verify responsive behavior and Accessibility.
5. Remove old CSS only after no references remain.
6. Preserve tool-specific layout classes.

## Target

Application repositories should mainly retain domain layout, tool-specific widgets, data/business logic and specialized visualization.

Foundation should own application chrome, accessibility, generic actions/forms/tables, generic states/messages, shared visual tokens, modal/toast conventions.
