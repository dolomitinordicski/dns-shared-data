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
- **DNS Design System:** v1.11
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

The current shared visual and interaction contract is **v1.11.1** and is documented in:

```text
docs/DNS-Design-System-v1.md
```

Its runtime source is `DNS_Core / designSystem/current`. Applications keep a local fallback and read the remote document for declarative tokens. Firestore contains configuration only; executable JavaScript remains versioned source code.

The v1.11 contract includes shared motion, focus, hover/press, tab and reduced-motion behavior, official DNS corporate color names and semantic color roles, selected-state context selectors, translucent sticky navigation with scroll progress, and the shared Foundation accessibility runtime.

The GitHub Pages architecture overview is also the visual reference implementation of this contract. It consumes the canonical tokens at runtime, prefers `DNS_Core / designSystem/current`, falls back to the versioned package mirror, and uses the shared motion/interaction behavior. The committed `web-runtime/design-system.js` browser mirror is CI-checked against `src/design-system.ts` to prevent silent drift.

## Shared UI runtime

DNS motion and interaction behavior is implemented as versioned, framework-agnostic source code in:

```text
src/ui/motion.ts
src/ui/interaction.ts
```

Applications may consume the repository as a Git dependency and pin a specific commit. The shared runtime exposes reveal/stagger helpers, reduced-motion handling, focus-visible styling, and opt-in hover/press feedback. Runtime configuration still comes from `DNS_Core / designSystem/current`; executable code never comes from Firestore.

## Organization logos

Canonical organizations may reference one primary public logo through `logoFile`. Logo assets live in `assets/organization-logos/`; keep `logoFile: null` until the correct asset has been uploaded and verified.


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
