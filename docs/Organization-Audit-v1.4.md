# DNS Organization Audit v1.4

**Date:** 30 September 2026  
**Scope:** canonical organization identity and DNS partner mapping.  
**Excluded:** logos, fiscal master data, XGLA4 records, application integration.

## Final clarification

The two remaining provisional DNS partner identities from v1.3 are now confirmed by DNS project ownership:

- **Seiser Alm DNS partner:** Seiser Alm Marketing
- **Cortina d'Ampezzo DNS partner:** Servizi Ampezzo

Because the shared dataset is not yet consumed in production by DNS applications, their technical organization IDs are corrected before first operational use:

```text
seiser-alm-marketing
servizi-ampezzo
```

This keeps organizations distinct from geographic entities such as:

```text
destination/seiser-alm
reportingArea/cortina-d-ampezzo
```

## Verified organization master

All current FAIR contributor organizations are now treated as verified for the first Firebase master seed.

The two newly resolved mappings are:

| Canonical organization ID | Organization | Reporting Area | Destination | Status |
|---|---|---|---|---|
| `seiser-alm-marketing` | Seiser Alm Marketing | Seiser Alm Dolomites Val Gardena | Seiser Alm | verified |
| `servizi-ampezzo` | Servizi Ampezzo | Cortina d'Ampezzo | Cortina d'Ampezzo | verified |

## Migration aliases

Legacy application labels remain aliases and must not be used as new canonical organization IDs.

For Seiser Alm:

```text
Seiser Alm
Alpe di Siusi
Seiser Alm Marketing Gen.
→ seiser-alm-marketing
```

For Cortina:

```text
Cortina
Cortina Marketing
Cortina d'Ampezzo
→ servizi-ampezzo
```

## Next architectural consequence

There are no remaining provisional organization identities blocking the first DNS Firebase Master Dataset seed.

The next phase may therefore create canonical operational collections for:

```text
reportingAreas
destinations
organizations
seasons
organizationRelationships
```

without touching Partner Portal, FAIR or Analytics runtime behavior yet.
