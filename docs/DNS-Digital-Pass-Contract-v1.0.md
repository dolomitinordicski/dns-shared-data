# DNS Digital Pass — Canonical Contract v1.0

**Date:** 2026-10-27  
**Status:** PROPOSED / design-only, NOT deployed  
**Pilot:** DNS season passes only (2026/27); area passes feature-flagged off  
**Authority:** DNS_Core canonical scopes; physical numbering inventory maintained by DNS Data Entry

## 1. Decision and non-goals

Physical sale continues at tourist associations. No LTS integration, online checkout, payment collection, clearing, PRIOT GPS, prize drawing, or mandatory guest account for use of the physical pass. A voluntary registration gives the purchaser a digital *representation* of the existing physical season pass. The physical pass remains independently usable.

DNS Workspace operator flow: enter physical pass number → server verifies inventory and sale eligibility → generate a **short activation code** → communicate code verbally → click **Validate** to attest the physical sale and enable that code. Guest flow: pass number + activation code + minimal personal data → email OTP → digital credential issued. Authenticated controls scan QR and request current status from the backend.

## 2. Canonical ownership and boundaries

- Data Entry: existing season/area/product physical-number matrices; authoritative inventory ranges only. **Inventory presence is not proof of sale.**
- Core/Shared Data: canonical season IDs, organization IDs, reporting-area IDs, product codes, authorization, versioned schema, audit rules.
- Workspace: operator UI; all mutations use backend authorization and transactions.
- Guest Registration: voluntary profile and verified email, separate from DNS operator Firebase Auth identities.
- Digital Pass: issued/revoked credential; no money or issuance of a second commercial ticket.
- Validation: restricted scanner and online verification; no public personal-data resolution from QR.
- Analytics: aggregated activation, registration and scan events; never infer accounting-certified sold volume from operator declarations alone.
- PRIOT: future adapter via stable pass/credential IDs and versioned events; its GPS/clearing models remain independent.

## 3. Identifiers / source of truth

`physicalPassId` is an opaque canonical ID; unique tuple `(seasonId, productCode, normalizedPassNumber)` must be enforced in the backend. Preserve raw printed number for display; normalization rules must be versioned. Do not assume numeric ranges are mutually exclusive across seasons/products. Each number must resolve to exactly one assigned organization / allowed selling scope before activation; ambiguous/out-of-inventory numbers are rejected.

Entities (private, server-authorized collections; names are proposed and must be mapped against the existing schema before implementation):

```text
passInventoryRefs { physicalPassId, seasonId, productCode, printedNumber, assignedOrgId, status, sourceRevision }
passSaleAttestations { id, physicalPassId, sellerOrgId, operatorUid, status, validatedAt, voidedAt?, voidReason?, auditId }
passActivationChallenges { id, physicalPassId, saleAttestationId?, codeVerifier, status, createdAt, activatedAt?, expiresAt?, failedCount, generation }
passHolders { id, givenName, familyName, verifiedEmail, emailVerifiedAt, preferredLanguage?, createdAt }
passRegistrations { id, physicalPassId, passHolderId, status, completedAt, consentRecordIds[] }
digitalCredentials { id, physicalPassId, passHolderId, generation, status, issuedAt, revokedAt?, expiresAt }
passValidations { id, credentialId, result, validatorUid, validatorOrgId, timestamp, locationScope? }
consentEvents { id, passHolderId, purpose, version, affirmative, timestamp, source, proofRef? }
passAuditEvents { id, actorType, actorId, action, targetId, at, correlationId, metadata }
```

Never export or expose activation verifiers, OTP secrets or bearer QR tokens through Data Entry, public Shared Data, Analytics, CSV, logs or client bundles.

## 4. Operator transaction

Permission `passActivation.issue` and `passSale.attest` restricted to authenticated membership and explicit `organization` scope grants. `dns-admin` can supervise. Grant names are proposed extensions to DNS Access Control v0.1; grants must exist before release.

1. `prepareActivation(passNumber, seasonId, productCode)`: check matrix, unique match, selling scope, season, existing sale/credential. Create a cryptographically random short code server-side, store only a keyed/HMAC verifier (key in secret manager), stage challenge and return its plaintext **once** to the requesting operator over TLS.
2. Display a **6-character uppercase human-friendly code** from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, e.g. `K7PM2R`. Avoid 0/O and 1/I. This is an activation secret, **not an OTP**. Six characters give approx. 30 bits of entropy: acceptable only with strict short lifetime, single-use, rate limits, scope checks and additional email verification. If risk assessment shows that insufficient, increase to 8 characters rather than weakening controls. Never derive it from pass number, timestamp or sequential counters.
3. Operator verbally provides code and clicks **Validate**. `attestSaleAndEnableChallenge` atomically records one sale attestation and enables the already staged challenge; repeated Validate with same idempotency key is safe. Before Validate, guest cannot activate. No second sale attestations without a controlled admin reversal.
4. UI timeout/cancel does not mark a sale. If Validate succeeds but response fails, idempotent re-query yields committed state. Reissue after operator error invalidates previous challenge, logs reason, and requires sale-scoped authorization; code cannot be displayed again after leaving the screen.
5. `SOLD` here means *operator-attested physical sale*, not certified cash-reconciled revenue. Keep separate from accounting-certified reporting.
6. Only numbers assigned to the authorized seller and explicitly eligible for DNS-season pilot are accepted. A colleague with the wrong area grant cannot activate a number.

## 5. Guest claim and email verification

- Guest enters physical pass number, matching short code, name, email and optional language. Private registration flow never announces whether a pass belongs to another identifiable person.
- Apply IP/device/pass-specific throttles, attempt limit (e.g. 5 failed attempts with escalation), generic errors and abuse monitoring. OTP: server-generated random value or one-time email link, short expiration (e.g. 10 min), retry limits, one-time use; no reuse as marketing opt-in.
- A private pending claim reserves a pass only for a bounded window; immutable uniqueness constraints and atomic finalization prevent double claims/races.
- Consume activation code and issue digital credential **only after successful email verification**. Support expired/abandoned registration without consuming valid codes.
- Email verification proves control of inbox; code proves access to a code verbally handed over during the sale. Neither alone is legal identity certification. Avoid describing the guest identity as government-verified.
- Corrected email, transfer, lost physical card, ownership disputes and recovery are admin-mediated, with revocation, audit and no public enumeration.
- Registration and marketing are separate purposes. Newsletter checkbox unchecked by default; log notice version, scope, legal basis/consent where appropriate, and a distinct marketing double opt-in, unsubscribe and retention. Never condition Digital Pass on marketing consent.

## 6. Credential and scan policy

QR encodes a high-entropy, opaque and revocable credential reference or signed short-lived token; **never** printed pass number, name, email, code or predictable sequential ID. Do not use the six-character activation code as QR credential.

Only an authenticated `passValidation.check`-granted operator may query `validateCredential`; return minimal result: `VALID | EXPIRED | REVOKED | UNKNOWN | NEEDS_ONLINE`, product and season; show holder name only if strictly justified by operational policy. Validator backend checks credential state, season window, physical status and relevant revocations on **each** online scan. Audit validation without unnecessarily retaining travel/location trails.

Pilot default: online validation only. A saved QR screenshot can be copied; static QR alone is not fraud-proof. The physical card remains fallback in no-network areas. Dynamic QR / safe offline verification / photo check can be added later behind versioned capabilities.

Separate states:
```text
inventory: ALLOCATED | BLOCKED | RETIRED
attestation: NONE | SOLD_ATTESTED | VOIDED
activation: PREPARED | ENABLED | CLAIM_PENDING | CONSUMED | EXPIRED | REVOKED
registration: PENDING_EMAIL | ACTIVE | SUSPENDED | CLOSED
credential: ACTIVE | SUSPENDED | REVOKED | EXPIRED
```
Revoking a digital credential must not implicitly invalidate the physical pass.

## 7. Minimal API contract (proposed)

```text
POST /v1/pass-activations/prepare    operator scoped; idempotency key
POST /v1/pass-activations/validate   operator scoped; commits sale attestation
POST /v1/pass-activations/reissue    restricted + reason + audit
POST /v1/pass-registrations/start    guest rate limited
POST /v1/pass-registrations/verify-email guest; atomic claim
GET  /v1/me/digital-passes           authenticated holder
POST /v1/pass-validations/check      validator scoped; no public lookup
POST /v1/admin/pass-credentials/revoke controlled privilege and reason
GET  /v1/admin/pass-activations/summary scoped aggregate only
```

All mutable operations enforce server auth, ownership, idempotency, optimistic revision or transaction, and audit correlation. Browser clients **must not** directly write authoritative pass, consent or activation collections. Feature flags: `dnsSeasonPilot` on; `areaSeasonPasses`, `priotAdapter`, `wallet`, `offlineValidation`, `dynamicQr` off (implementation identifiers should use `priotAdapter`).

## 8. Operational controls and tests

- Unique claim across all organizations, operator double-click, concurrent claims, wrong area, code reissue, rollback, expired challenges, sold-vs-matrix distinction, revocations and QR replay all covered by integration tests.
- Strong random source, secret storage, rate limits, transport protection, no sensitive logs, role-gated scanner and Firestore deny-by-default are release blockers.
- GDPR: data minimization, controller/processor allocation, notice, rights, retention policy, access reviews and consent evidence before go-live. A data-protection review should confirm cross-border processing.
- Reconcile `SOLD_ATTESTED` records with physical sales independently if used for financial reporting; do not backfill unconfirmed sales.
- Acceptance: seller can do number → spoken 6-character code → Validate without additional paperwork; buyer can complete registration voluntarily; no marketing opt-in required; a credential scanned by an unauthorized or unauthenticated user discloses no holder data; revocation takes effect for next online scan.
- First launch is **not** an authoritative full sales register because non-participating/older offline sales may remain absent.

## 9. PRIOT extension seams

Preserve `physicalPassId`, `registrationId`, `credentialId`, idempotent domain events (`PassSaleAttested`, `DigitalPassIssued`, `DigitalPassRevoked`, `CredentialValidated`) and versioned interfaces. PRIOT may consume scoped pseudonymous entitlements; GPS, Hausloipe and clearing are never put inside guest profile or credential QR. No implementation of PRIOT in this release.

## 10. Implementation sequence

1. Reconcile numbering matrix schema and organization assignments in Data Entry.
2. Add canonical types + access grants + server-only write rules and test suite.
3. Implement operator prepare/Validate flow in Workspace.
4. Build guest registration + OTP + privacy/marketing separation.
5. Implement digital QR and authenticated scanner with revocation.
6. Pilot test with DNS seasonal numbers only, measure errors and voluntary uptake; review before area expansion.

**Contract gate:** design approval does not authorize rollout or claims that Digital Pass is live.
