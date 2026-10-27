# Partner Foundation v1.0 — acceptance cases (implementation gate)

This checklist accompanies PR #162 and is **not** a claim that tests have been executed.

## Contract and aggregation
1. One establishment assigned to one canonical reportingArea is counted once even if duplicate active partnership rows exist.
2. Pending, suspended, ended and prospect establishments are excluded from current active count.
3. `effectiveFrom` inclusive; `effectiveTo` exclusive.
4. Historical snapshots **must** read historically correct partnership and establishment-area revisions. The present simple pure helper assumes its supplied rows are already a consistent as-of snapshot and is NOT an event-history reconstruction engine.
5. Distinguish missing bed capacity from reported zero; unknown capacity must not silently lower denominators.
6. Two overlapping capacity revisions for one establishment cause a validation error; valid nonoverlapping revisions produce the applicable snapshot.
7. Historical reassignment from reportingArea A to B must never rewrite counts from previous seasons.

## Authorizations
8. Hotel A cannot read/modify hotel B or obtain records through collection listings.
9. Regional reviewer cannot read other reportingAreas without explicit grants.
10. Disabling an account or accreditation revokes respective access/seal behavior via backend.
11. Public widget configuration does not confer authority to render a partner badge.

## Voucher privacy
12. Voucher API, Firestore documents, QR payload, email payloads, exports and application logs contain no guest name/contact information.
13. Unauthenticated voucher creation fails; price/product and status are server-authoritative.
14. Hotel-only lookup of nominal guest through local PMS must function with central system offline; no central promise of recovering missing nominal records.

## Release gate
- TypeScript package build and tests must run in CI.
- Firestore Rules Emulator suite must include cross-tenant denied-access assertions.
- No deployment before production rules, identity, IAM and retention review.
- Compare current FAIR partner count definition and published snapshot logic before connecting consumer.
