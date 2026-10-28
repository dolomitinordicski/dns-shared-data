# DNS Foundation 1.4.0 — Gap Analysis & Delivery Plan

Status: **planning / not released**. Baseline: main on 2026-10-28. Scope is shared UI infrastructure; business logic and authorization remain in consumers/DNS Core.

## Verified source audit

| Area | Current baseline (files inspected) | Gap and 1.4.0 change | Priority |
| --- | --- | --- | --- |
| Appearance | `src/ui/accessibility.ts`: persisted a11y settings, newly added light/dark selector and theme CSS on main | dark styling must cover shared elements whose rules still hard-code white; initialize theme before first paint; test refresh/login, preference fallback, strong contrast and per-area accents | P0 |
| Print | `src/ui/print.ts`: print profiles, print sheet, @page, table break controls | add printable document readiness checks for fonts/images/SVG/charts, page sizing beyond A4 assumptions, diagnostics; do not own per-tool report content or replace browser's vector print | P0 |
| Data UI | `src/ui/data-ui.ts`: CSS for dirty/saving/saved/error, toolbar, column picker and pagination | formalize save-status and table interaction contracts/API; persistence, validation, DB writes and business transaction semantics remain consumer-owned | P1 |
| Identity/access | `src/ui/identity.ts`: visual classes for account, role, access states | add optional permission-aware rendering primitives consuming **resolved** grants, no frontend authorization or grants invention | P1 |
| Workspace | `src/ui/workspace.ts`: inspector open/collapsed/hidden and mobile panel API | add opt-in persisted layout state, per-tool namespacing and reset; preserve current layout defaults | P2 |
| Accessibility QA | `src/ui/accessibility.ts`: options, toggles, storage, localization | keyboard/focus/ARIA & WCAG 2.2 AA tests, theme visual regressions, reduced motion, contrast; resolve CSS hardcoding | P0 |
| Localization | `src/localization.ts`: DE/IT messages, language persistence and formatting | missing-key and clipping validation, avoid silent fallback for new UI; EN requires explicit contract/migration | P1 |
| Overlays | `src/ui/overlay.ts`: existing overlay API | evaluate focus trap, focus return, escape, screen reader semantics across all consumers before adding notification center | P1 |
| Diagnostics | foundational runtime + data-state classes exist | read-only version/build/connectivity diagnostics, no secrets or personal data, network != Firebase health | P2 |

## Release gates (must pass before tagging)

1. Package build/typecheck and existing test suite green.
2. Shared visual snapshots: Light/Dark, desktop/mobile, operational/portal/workspace profiles and regional accent contexts.
3. Pre-paint theme persistence: refresh, logout/login on same origin; clarify browser-local storage is not account-wide multi-device sync.
4. Print fixtures: table multipage, missing image, asynchronous chart, vector SVG, A3/A4/A5 portrait/landscape; no clipped headers or empty charts.
5. Keyboard navigation, focus trapping, accessible labels and contrast WCAG 2.2 AA.
6. Consumer compatibility matrix, unchanged public APIs unless explicitly versioned, no CSS legacy forks.
7. Publish only an immutable `foundation-v1.4.0` via existing `release-foundation.yml`, which calls `propagate-foundation-release.yml`; inspect PRs/CI before merging consumer updates.

## Sequencing

- Phase A (P0): theme quality, Accessibility QA and print readiness.
- Phase B (P1): save/table contracts, permission-aware UI, localization checks.
- Phase C (P2): workspace layout memory and diagnostics.
- Optional after audit: command palette/notifications/undo-redo only if existing primitives are insufficient and there are two or more concrete consumers.

## Guardrails

- No new dispatch/propagation architecture: existing workflows handle releases.
- Do not publish or propagate 1.4.0 until explicitly approved.
- Never change financial/FAIR logic, customer data, Firestore authorization, or per-tool persistence as part of Foundation.
- Fixed theme is scoped to a browser/origin; cross-domain synchronization requires separately designed authenticated preference storage, not assumed.
- Confirm the current Foundation 1.3.0 consumer PR backlog before 1.4.0 release.
