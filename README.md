# DNS Shared Data

Central source of truth for the Dolomiti NordicSki digital ecosystem.

This repository contains:

- the canonical DNS master dataset;
- shared technical identifiers and legacy mappings;
- architecture/foundation documents that define data ownership and boundaries.

## Current versions

- **DNS Foundation:** v1.2
- **Canonical Dataset:** v1.6
- **Seasonal Operational Dataset:** v0.2
- **DNS Design System:** v1.2
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
  DNS-Access-Control-v0.1.md

scripts/
  seed-firestore.ts

firestore.rules
firebase.json
.firebaserc
```


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
docs/Seasonal-Operational-Dataset-v0.2.md
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
