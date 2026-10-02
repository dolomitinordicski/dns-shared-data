
## Stable Foundation release

The shared Foundation is frozen as:

```text
Foundation package/runtime  1.0.0
Stable ref                  release/v1.0.0
DNS Design System           1.24.0
DNS Data Contracts          0.8.0
Status                      stable / frozen
```

Consumer migrations must target the stable release ref rather than `main`, `master` or arbitrary raw commit SHAs.

The package remains private/internal to DNS. Release policy and compatibility rules:

```text
docs/DNS-Foundation-Release-Freeze-v1.md
releases/v1.0.0/manifest.json
@dolomitinordicski/dns-shared-data/release
```

F8 freezes the compatibility surface completed through F7. Future breaking changes require a new MAJOR Foundation release; compatible features use MINOR and fixes use PATCH.

# DNS Shared Data

Central source of truth for the Dolomiti NordicSki digital ecosystem.

This repository contains:

- the canonical DNS master dataset;
- shared technical identifiers and legacy mappings;
- architecture/foundation documents that define data ownership and boundaries.

## Current versions

- **DNS Foundation:** v1.2
- **Canonical Dataset:** v1.6
- **Seasonal Operational Dataset:** v0.3
- **DNS Design System:** v1.24
- **DNS Access Control:** v0.1

## Source of truth

Application repositories such as Partner Portal, FAIR and Analytics must not become independent owners of canonical DNS master data.

Canonical IDs are technical identifiers and therefore use lowercase ASCII kebab-case. Human-facing names remain properly capitalised and multilingual.

## Data boundary

This repository is public and therefore must contain **no personal data, poll participant data, fiscal data, credentials, secrets or accounting records**.

XGLA4 remains the authoritative accounting system.

## Structure

```text
src/
  canonical-data.ts
  index.ts

assets/
  organization-logos/
    public organization logo assets

docs/
  DNS-Foundation-v1.2.md
  Organization-Audit-v1.3.md
  Organization-Audit-v1.4.md
  Firebase-Master-Dataset-v0.1.md
  Firebase-Master-Dataset-v0.2.md
  Seasonal-Operational-Dataset-v0.1.md
  Seasonal-Operational-Dataset-v0.2.md
  Seasonal-Operational-Dataset-v0.3.md
  DNS-Access-Control-v0.1.md

scripts/
  seed-firestore.ts

firestore.rules
firebase.json
.firebaserc
```


## DNS Design System

The current shared visual and interaction contract is **v1.24.0** and is documented in:

```text
docs/DNS-Design-System-v1.md
```

Its runtime source is `DNS_Core / designSystem/current`. Applications keep a local fallback and read the remote document for declarative tokens. Firestore contains configuration only; executable JavaScript remains versioned source code.

The v1.11 contract includes shared motion, focus, hover/press, tab and reduced-motion behavior, official DNS corporate color names and semantic color roles, selected-state context selectors, translucent sticky navigation with scroll progress, and the shared Foundation accessibility runtime.

The GitHub Pages architecture overview is also the visual reference implementation of this contract. It consumes the canonical tokens at runtime, prefers `DNS_Core / designSystem/current`, falls back to the versioned package mirror, and uses the shared motion/interaction behavior. The committed `web-runtime/design-system.js` browser mirror is CI-checked against `src/design-system.ts` to prevent silent drift.








## Foundation assets & workspace

F7 standardizes shared asset metadata and the authoring workspace:

```text
assets: brand · region-logo · organization-logo · graphic · icon · photo · template · document
workspace: toolbar · canvas · inspector · mobile-panel
```

Contract:

```text
docs/DNS-Assets-Workspace-v1.md
@dolomitinordicski/dns-shared-data/assets
@dolomitinordicski/dns-shared-data/workspace
```

Portal and Flyer Studio consume the same canonical asset metadata. Workspace chrome is Foundation-owned; creative canvas rendering/export remains tool-owned.

## Foundation identity / membership / access UI

F6 standardizes authenticated context presentation:

```text
User → Membership → Organization
User → Access Grant → Scope/Permissions
```

Foundation renders account context, organization switcher, membership role, access indicators and session actions. Authentication, tokens and authorization decisions remain platform-owned.

Contract:

```text
docs/DNS-Identity-Access-UI-v1.md
@dolomitinordicski/dns-shared-data/identity-ui
```

## Foundation overlays, forms, uploads & data UI

F5 standardizes shared operational UI:
- accessible overlays and focus lifecycle;
- form states including dirty/saving/saved;
- upload/drop-zone states;
- search/filter/sort/pagination/column/selection/bulk/export controls;
- expanded application states including unauthorized/forbidden/not-found/syncing/stale.

Contract:

```text
docs/DNS-Data-UI-Overlays-v1.md
@dolomitinordicski/dns-shared-data/data-ui
```

Foundation owns presentation/accessibility; tools retain business validation, persistence, queries and workflow logic.

## Foundation motion & interaction semantics

F4 replaces application-owned motion values with shared semantic events:

```text
enter · exit · expand · collapse · modal · drawer · toast · tab · contextChange · loading
```

Interaction feedback uses semantic roles:

```text
action · selection · toggle · navigation · destructive
```

Contract:

```text
docs/DNS-Motion-Interaction-Semantics-v1.md
@dolomitinordicski/dns-shared-data/motion-semantics
```

Consumers trigger semantic motion through `foundation.playMotion()`. Both system reduced-motion and the DNS Accessibility “reduce motion” setting suppress movement and resolve the final state directly.

## Foundation print profiles

F3 defines three canonical printable artifact profiles:

```text
operational-table — dense operational tables
report            — analytical/management document flow
document          — formal confirmations/forms/documents
```

Contract:

```text
docs/DNS-Print-Profiles-v1.md
@dolomitinordicski/dns-shared-data/print-profiles
```

Consumers select the profile through `initDNSFoundation({ printProfile })` or per artifact with `foundation.printNow(profile)`.

`creative-export` is deliberately outside the Foundation print runtime: Flyer Studio uses the same Foundation for its editor UI, but its creative output is rendered by the authoring engine.

## Foundation shell profiles

F2 defines three canonical structural profiles while keeping one Design System and one runtime:

```text
operational — FAIR / Analytics / Data Entry / Polls / Faktura / Hub
portal      — Partner Portal / authenticated account-aware access layers
workspace   — Flyer Studio / creation and editing environments
```

Contract:

```text
docs/DNS-Shell-Profiles-v1.md
@dolomitinordicski/dns-shared-data/shell-profiles
```

Applications declare the profile through `initDNSFoundation({ shellProfile: ... })`. Operational remains the default for backward compatibility. Portal does not inherit Operational tab navigation, and Workspace does not force administrative page geometry onto the creative canvas.

## Unified Foundation runtime

F1 introduces the canonical orchestration entry point:

```ts
import { initDNSFoundation } from '@dolomitinordicski/dns-shared-data/foundation';
```

Contract:

```text
docs/DNS-Foundation-Core-Runtime-v1.md
```

The runtime owns the shared Design System → CSS-variable bridge and initializes the common Foundation capabilities from one source: primitives, content patterns, interaction, motion, tool chrome, print, footer, accessibility and DE/IT language state.

Application repositories must migrate away from local Design System fallbacks, local `applyVariables()` functions and one-by-one shared runtime initialization during the consumer consolidation pass. Tool-specific business/calculation engines remain application-owned.

The same built module is published on GitHub Pages at `dist/foundation.js`, allowing static tools such as Hub to consume the identical runtime instead of maintaining a parallel static implementation.

## Shared UI runtime

DNS motion and interaction behavior is implemented as versioned, framework-agnostic source code in:

```text
src/ui/motion.ts
src/ui/interaction.ts
```

Applications may consume the repository as a Git dependency and pin a specific commit. The shared runtime exposes reveal/stagger helpers, reduced-motion handling, focus-visible styling, and opt-in hover/press feedback. Runtime configuration still comes from `DNS_Core / designSystem/current`; executable code never comes from Firestore.

## Organization logos

Canonical organizations may reference one primary public logo through `logoFile`. Logo assets live in `assets/organization-logos/`; keep `logoFile: null` until the correct asset has been uploaded and verified.



## Governance & reproducibility

F0 governance is defined by the following normative documents:

```text
docs/DNS-Canonical-Change-Control-v1.md
docs/DNS-Canonical-Dataset-Changelog.md
docs/DNS-FAIR-Reproducibility-v1.md
docs/DNS-Data-Governance-Compliance-v1.md
docs/DNS-Implementation-State-Policy-v1.md
docs/DNS-Operational-Runbook-v1.md
```

Key rules:
- canonical changes are classified as MAJOR / MINOR / PATCH;
- money-moving canonical changes require institutional approval and a future effective season;
- approved FAIR seasons use immutable, versioned input and result snapshots;
- technical implementation state must be distinguished from target/planned architecture;
- public documentation may record governance references, but never secrets, PII or confidential approval material.

The typed FAIR snapshot contract is exported from:

```text
@dolomitinordicski/dns-shared-data/fair-governance
```

The persistence collections `fairInputSnapshots` and `fairResultSnapshots` are Foundation-defined targets; no Firebase write implementation is implied merely by the contract.

## Firebase Master Dataset

DNS_Core uses Firebase project `dns-core` with Firestore database `(default)`.

The current Firebase master layer is documented in:

```text
docs/Firebase-Master-Dataset-v0.2.md
```

Seed tooling:

```bash
npm install
npm run seed:firebase
npm run seed:firebase:apply
```

The default command is dry-run only. The apply command requires trusted administrator credentials and writes/merges canonical master data into DNS_Core.


### Current public master collections

DNS_Core exposes read-only canonical reference data for:

```text
reportingAreas
destinations
organizations
organizationRelationships
seasons
```

Client writes remain denied. All non-master collections remain closed by default.

## Seasonal operational data

Season-specific pricing, ticket orders, ticket sales and KP/track input are modelled separately from canonical master data. The current operational contract is documented in:

```text
docs/Seasonal-Operational-Dataset-v0.3.md
```

The operational schema is exported from `src/seasonal-operational-data.ts`. It supports season-versioned prices, ticket orders/order lines, network/area/organization overrides, frozen pricing snapshots, raw ticket quantities, KP milestones, provenance/method versioning, append-only corrections and draft/submitted/verified workflows.


## Authentication and access control

DNS tools use Firebase Authentication for identity and private Firestore metadata for authorization.

The v0.1 contract is documented in:

```text
docs/DNS-Access-Control-v0.1.md
```

Authorization collections:

```text
users
memberships
accessGrants
```

Authenticated clients may read only their own authorization context. Browser writes to these collections remain denied.



## Foundation localization

German/Italian bilingualism is a shared Foundation capability.

Normative contract:

```text
docs/DNS-Localization-v1.md
```

Runtime/package contract:

```text
@dolomitinordicski/dns-shared-data/localization
```

Operational rules:
- German (`de`) is the primary, default and fallback UI language;
- Italian (`it`) is the secondary UI language;
- automatic browser-language selection is not used;
- shared browser preference key is `dns-ui-language-v1`;
- UI language and authored content language are separate concepts;
- shared Foundation copy and number/date/currency formatting must not be independently reimplemented by tools.

Canonical datasets may retain additional localized metadata (for example existing English display names) for interoperability/history. That does not make those languages supported DNS UI languages.

## Foundation accessibility

Accessibility preferences are a shared Foundation capability, not a per-tool reinvention.

The canonical runtime lives in:

```text
src/ui/accessibility.ts
```

Package consumers import:

```text
@dolomitinordicski/dns-shared-data/ui/accessibility
```

The module provides text scale, high contrast, relaxed spacing, reduced motion, stronger keyboard focus and comfortable UI density. Preferences are persisted only in browser `localStorage` under `dns-accessibility-v1`; they are never written to Firebase and contain no user profile or personal data.

Keyboard shortcut: `Alt+A`. `Escape` closes the panel.


## Shared navigation runtime

Sticky navigation behavior is centralized in `@dolomitinordicski/dns-shared-data/ui/navigation`.

The runtime owns:
- measured sticky header/navigation offsets;
- document scroll progress;
- deterministic active-section tracking for section-based pages;
- shared tab/navigation interaction geometry.

DNS tools may vary navigation content, but not navigation behavior. Fixed sticky offsets and app-specific scroll-spy implementations are not allowed.


## Shared print runtime

Printable DNS tools use `@dolomitinordicski/dns-shared-data/ui/print`.

The Foundation owns page size, orientation, margins, print header geometry, table typography, borders, totals, tabular numbers and body-level print-sheet behavior through `DNS_DESIGN_SYSTEM.print`.

Tool-specific print content is allowed. Tool-specific print styling and `window.open/document.write` print implementations are not.
