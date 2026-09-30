# DNS Shared Data

Central source of truth for the Dolomiti NordicSki digital ecosystem.

This repository contains:

- the canonical DNS master dataset;
- shared technical identifiers and legacy mappings;
- architecture/foundation documents that define data ownership and boundaries.

## Current versions

- **DNS Foundation:** v1.2
- **Canonical Dataset:** v1.4

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
```


## Organization logos

Canonical organizations may reference one primary public logo through `logoFile`. Logo assets live in `assets/organization-logos/`; keep `logoFile: null` until the correct asset has been uploaded and verified.
