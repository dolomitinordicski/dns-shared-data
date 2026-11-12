# Partner Hub membership registry — DNS Core

This change is a **staging-only data contract**, not a login enablement, and creates **no membership records** in Firebase.

## Contract
Trusted collection `partnerHubMemberships/{uid}__{establishmentId}`:
- `schemaVersion: 1`
- `uid`: Firebase Auth user UID (verified and enabled)
- `establishmentId`: ID of an existing, active `partnerEstablishments` document
- `active: true|false`
- `status: 'verified'|'revoked'`
- `source`, `createdAt`, `updatedAt`: admin-only metadata
- Each membership is checked again by the Partner Hub backend for every protected action. A membership does **not** grant permission to read Analytics.

All client get/list/write operations are denied by `firestore.rules`, including DNS Admin. Backend Admin SDK alone can read and write. Its permissions must be configured with least privilege when deployed.

## Safe provisioning
Dry-run:
```bash
npm run provision:partner-hub -- --email=verified@domain.example --establishment=existing-hotel-id
```
A deliberate future administrative application requires `--apply --confirm-project=dns-core`, `GOOGLE_CLOUD_PROJECT=dns-core` (or equivalent), and trustworthy server credentials. It refuses missing/disabled/unverified users, unknown/inactive establishments and duplicate mappings. It appends an audit record in the same transaction. No example account is actually created or written.

Revocation is a separate audited admin action; **do not** revoke by deleting a document casually. Backend readers must reject a missing, inactive, or non-verified record.

## Release gates
1. Check existing canonical `partnerEstablishments` active flags and reconcile record IDs; don't invent structures.
2. Have DNS Admin explicitly approve real email↔establishment mappings. Do not embed names, emails, credentials, or partner codes in source.
3. Validate with two real partner identities and intentional denied account, and repeat after revocation/expiry.
4. Configure token signature/project checks and read-only backend access (PR #78, currently Draft). No enablement of login/iframe until this is done.
5. Analytics #59 requires a separate trusted server-side data projection and grants; **no directly readable sensitive Firebase collections from a partner iframe**.
6. No merge, Firebase rules deployment or IAM modification without separate explicit release authorization.

## Legacy data
Historical Analytics statistics are not touched. Zero-loss migration and full seven-tab parity remain mandatory before any Analytics cutover.
