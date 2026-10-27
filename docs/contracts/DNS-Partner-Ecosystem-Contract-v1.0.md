# DNS Partner Ecosystem — Architecture & Data Contract v1.0 (PROPOSED)

**Date:** 2026-10-27  
**Status:** proposed architecture, NOT an activated service, approved quality standard, or production security certification  
**Owners:** DNS Platform / DNS Workspace / DNS Partner Hub  
**Principle:** Keep it simple for users; one authoritative record; extensive but dormant extension points.

## 1. Decisions and boundaries

- **DNS Workspace** is the operational app for DNS management and authorized territorial users. **Partner Management** is a module therein, not another authentication platform or duplicative standalone tool.
- **DNS Partner Hub** (target repository name `dns-partner-hub`, currently `DNS-Partner-Portal-Hub-v2`) is the B2B app for accommodations and other partners, with a public informational surface and authenticated personalized services.
- **DNS Core / Shared Data** supplies canonical identities, organizations, reportingAreas, seasons, authorization contracts, design tokens/assets and data contracts. Do not duplicate registries.
- **DNS Analytics** owns longitudinal/network intelligence, dashboards, growth, geographic and capacity analysis; **Partner Management** owns operational dashboards and actionable queues.
- **DNS FAIR** consumes only contract-governed, season-specific official partner counts by canonical reportingArea; existing FAIR methodology remains unchanged. Overnight stays are deliberately out of scope for initial implementation.
- Existing portal marketing/editorial content (vision, philosophy, values, history, quality criteria, partner benefits, corporate design and downloads) is retained and reorganized; brand assets/tokens are centrally governed.
- Rename of repositories is a separate, dependency-audited operation; this contract does not rename repos, change package names, or deploy code.

## 2. Core entities and stable IDs

Use existing canonical `organizations`, `organizationRelationships`, `reportingAreas`, `seasons`, `users`, `memberships`, `accessGrants`. Introduce separate domain records, without redefining their identifiers:

| Entity | Minimum attributes / relations |
| --- | --- |
| Establishment | `establishmentId`, `organizationId`, `establishmentType` (accommodation, rental, school, service etc.), canonical `reportingAreaId`, location, contact/public profile, status |
| AccommodationCapacityRevision | `establishmentId`, authorised bed places, rooms/units, seasonal opening dates, `validFrom`, `validTo`, `recordedAt`, source, verification status |
| Partnership | `partnershipId`, `establishmentId`, lifecycle state, `effectiveFrom`, `effectiveTo`, history, reason |
| Accreditation | `accreditationId`, `establishmentId`, criteria version, state, decision author/date, validity dates, evidence references |
| CriteriaSet / Criterion | version, effective dates, immutable published version, multilingual content, category (mandatory / improvement / informative), applicability, proof requirement, review instructions |
| Assessment / Finding | criterion version, self declaration, verification, reviewer, evidence IDs, nonconformance, due date, corrective actions |
| Document / Evidence | owner/scope, purpose, storage URI, checksum, MIME type, access class, retention, verification state |
| UserMembership / AccessGrant | existing DNS contracts; scope to establishment/organization/reportingArea as authorized |
| Communication / Case / Task | recipients, reason, template version, locale, delivery outcome, requested actions, due date, activity trail |
| WidgetConfiguration | immutable `widgetId`, public/partner type, public configuration, establishment association as required, language, reportingArea, modules, display preset, status |
| Benefits / Campaign / Participation | catalog version, eligibility, entitlements, redemption or participation references, without assuming a billing service |
| PartnerEvent | immutable event ID, entity ID, type, actor, `occurredAt`, `recordedAt`, correlation ID, schema version, payload classification |
| MetricSnapshot | `seasonId`, `reportingAreaId`, metric ID, definition version, value, as-of timestamp, source revision, approval state, integrity references |

An Organization can own several Establishments; a user may belong to several Organizations; an Establishment can have multiple user delegates, capacity revisions and accreditations. Preserve source aliases and historical IDs on import. **Never equate the hotel contact person with the guest named on a voucher.**

## 3. State machines and definitions

- Partnership: `prospect → applicant → active → suspended/ended`; reinstatement is an explicit dated event. Pending criteria remediation must not automatically end the partnership.
- Accreditation: `not-assessed → submitted → under-review → approved | changes-requested | rejected`; an approved accreditation can expire, be suspended or revoked with an audit record. Exact transitions, terms, grace periods and reviewer roles are to be approved.
- Account/access: separately granted/revoked independent of the two statuses above, permitting remediation after suspension.
- **FAIR partner count:** initially define candidate eligibility as establishments with `partnership.state=active` as of an explicit snapshot date, deduplicated by establishment ID and assigned to one canonical reportingArea for counting. Before production, reconcile this definition with the currently approved FAIR interpretation and treatment of multi-site/multi-area businesses.
- Unknown values are `null`/missing, **never zero**. Track `observed | self-declared | verified | estimated | missing | not-applicable` per field, source and date.
- Historical import must not fabricate join dates or convert old self-assessments into freshly approved certifications.

## 4. Quality criteria: legacy now, new rules later

- Import original DNS Self Evaluation Test and responses as **legacy/historical** records and evidence, with consent/retention review before moving personal data.
- Quality Standard 2027 is **draft only** until formally approved by DNS competent governance. A published criteria version must remain immutable. New versions may map forward prior evidence but must not mutate old decisions.
- Distinguish: objective core information requirements; sport-specific accommodation quality; optional improvements; statistical/network survey.
- Candidate new rule: certified DNS partner widget on accredited partner site, instead of the obsolete physical sign. **Not yet mandatory**; working group decision required.
- Physical signs are proposed for retirement; do not enforce or disqualify a partner due to a sign DNS has not provided.
- Support electronic requests for missing evidence, proof uploads, deadlines, multilingual remediation email and partner self-service corrections. DNS reviews and approves.
- Periodic self-evaluation and independent verification may have distinct outcomes.

## 5. Public and certified dynamic widgets

- ONE widget creation/runtime engine with two authorization profiles:
  - **Public Widget:** accessible to nonpartners (including rentals, schools and other sites) without login, no quality seal.
  - **Certified Partner Widget:** issued/managed by appropriately authorized partner, associated to establishment and approved accreditation; the server verifies eligibility for rendering the seal.
- Both offer configurable canonical reportingArea or whole DNS scope, language DE/IT/EN, trail kilometers/status, optional map link, weather, prices and formats. Show only data provided by authoritative compatible services.
- The public iframe embeds a stable `widgetId` and loads CSS/layout/data from a central versioned **Widget Runtime**. Changes to brand/design and data propagate without updating embed code. Provide responsive iframe height strategy and rollback.
- No forged partner badge via URL parameters, frontend flags or a copied config. Seal must link to a public, privacy-safe verification endpoint and disappear on suspension/revocation according to the published policy.
- Trail status source (Contwise), open-km math, license/attribution, update frequency, freshness and fleet grooming info require source verification; absent data must not be presented as zero/live. Draft trail-status contract in separate PR #160 is **not production integration**.
- Embeds must be resilient, CSP-aware, rate-limited and cacheable; do not expose private organization data.

## 6. Blind Voucher: guests' names must never reach DNS central services

**Hard invariant:** the central voucher record, API requests, QR URL, email notifications, telemetry, analytics and server logs SHALL NOT contain guest names or other unnecessary identifying guest fields.

- Hotel creates a nominal print/export locally; DNS central stores only cryptographically random opaque `voucherId`, establishment/issuer ID, product/category, validity, official status, issuance time and minimal business metadata.
- Voucher token is server-issued and unguessable; server validates entitlement and state transitions. No client-trusted price, status, beneficiary, or voucherCode; implement idempotency and uniqueness. Verification endpoint returns minimum necessary validity/status and applies abuse protection.
- **Preferred initial guest-name recovery:** association between voucher ID and guest/reservation maintained in the hotel's PMS/local controlled records. No DNS-central nominal recovery.
- **Optional future mode:** end-to-end encrypted hotel-owned vault, with keys controlled by hotel, designed with recovery/backup, key rotation and incident response. This is a separate security/privacy project, NOT justified as GDPR-exempt merely because admins lack the decryption keys.
- Current v2 portal code violates this target: voucher Firestore stores `guestName`, broad signed-in access, anonymous demo auth, untrusted client-generated voucher values and unprotected notification endpoint. Do not migrate or deploy the current implementation as-is.
- GDPR roles, data minimization, legal bases, processor/controller responsibilities, retention and DPIA necessity require legal/privacy review; pseudonymity/encryption do **not** automatically eliminate GDPR responsibilities.

## 7. Central permission and security gates

- Firebase Authentication or the designated DNS identity provider authenticates a person; backend checks membership, scoped grants and current entity state. No client-selected admin roles; disable anonymous demo access for private production endpoints.
- Extend current DNS Access Control schema with scoped permission families `partner.*`, `establishment.*`, `criteria.*`, `accreditation.*`, `communication.*`, `widget.*`, `partnerMetrics.*`, `voucher.*` through explicit additive versioned contracts.
- Cross-organization isolation and least privilege are enforced by backend and Firestore rules; never rely on UI filtering.
- Require tests for hotel A vs B, regional scoped reviewer vs other regions, global admin, public widget, inactive accreditation, revoked user, and voucher validation.
- Add authenticated/rate-limited email backend, fixed or allowlisted destinations, escaping/sanitization, queue/retry and truthful sent/failed state; no nominal guest details in fallback logging.
- RBAC/ABAC changes, publication, approval, deletion and exports are auditable. Privacy-related deletion is assessed under retention/legal obligations, not implemented via broad document delete permission.
- Actual deployed Firebase rules, IAM, Storage rules, service accounts, secret handling and hosting configuration **must be audited** before production activation.

## 8. Metrics, FAIR, Analytics and capacity

The operational DB is source of truth for mutable establishment records; Shared Data owns **contracts and published aggregates**, not a second writable live register.

- Partner Management computes audited per-reportingArea and per-season metrics; a durable publication mechanism makes approved aggregates available through DNS Shared Data contracts.
- FAIR consumes `activePartnerEstablishments` with documented `seasonId`, `reportingAreaId`, eligibility definition, snapshot revision and approval; no automatic modification of FAIR formula.
- DNS Analytics receives partner count, new joins, departures, net change, retention, quality trends, engagement, certified-widget adoption, capacity, geography and age of pending tasks.
- Capacity: authorized bed count, rooms/units, date-effective opening windows and establishment type. Compute **available bed-nights = authorized bed places × eligible operating days**, accounting for capacity changes and closures. Occupancy and overnight stays stay inactive until a trustworthy source and methodology exist.
- Later economic scenarios must explicitly distinguish observations, self-declarations, assumptions and model outputs. Ticket sales are not attributable directly to partner bed-nights without a validated reconciliation.
- Historical heatmap: canonical reportingArea × season with both counts and % changes; geographic layers only with validated establishment coordinates.
- Introduce data-quality completeness and source lineage; do not rank areas by counts without denominators and disclosure of coverage.

## 9. Extensibility prepared but INACTIVE

Prepare stable domain boundaries and permissions, **not empty UI screens** for:
benefits wallet, partner communications/campaigns and preferences, conventions, school/rental/mobility service network, training/events, recruitment pipeline, ticket referrals, partner economic intelligence, occupancy/overnight stays, geo catchments, engagement index, benchmarking, integration/API/webhook subscriptions, complaints, surveys, service usage, multi-site groups, accounting/settlement, internationalization and legal document acceptance.

Each optional module uses versioned contracts, feature flags, permissions and schema migrations; no activation before product, privacy, data and governance approval.

## 9A. Public first activation, establishment claim and user-owned credential (2026-10-27 amendment)

DNS shall **not** generate or email a username/password pair to every partner. The partner initiates activation from a generic public URL (e.g. Partner Hub /activate). The URL itself conveys **zero entitlement** to an existing establishment.

1. Visitor selects an existing establishment from a privacy-safe lookup, or submits a new establishment application. Public search must not expose internal partner contact details, records or enumeration-friendly responses.
2. Visitor verifies control of a work email address with a short-lived, single-use OTP or provider verified email link; rate limits, abuse prevention, neutral responses and hashed challenge storage required.
3. **Independent second factor / business claim:** verify a separately established phone channel or TOTP/passkey, AND authorize the claim to the establishment through pre-registered authorized contact, one-time establishment claim token, or explicit DNS/regional reviewer approval. Two emails or two codes delivered to the same inbox are NOT two independent factors. Mere possession of the public URL, a domain or a self-entered mobile number is never enough to take over an existing hotel.
4. An authenticated, verified claimant completes first-time onboarding: legal/trading business identifiers, establishment ID, location/reportingArea, authorized representative, operational contact, authorized bed count, rooms/units, winter opening period, services, required terms and privacy notices. Mark claims self-declared until reviewed; never overwrite verified canonical records automatically.
5. User chooses their **own login credentials** using the designated DNS identity provider (Firebase Auth where appropriate). Never collect a plaintext password in DNS application databases, analytics, emails or logs. Allow secure password reset and later optional passkeys/MFA. Email is the preferred account identifier; arbitrary usernames are optional and should not become a new identity silo.
6. Activation is an atomic, idempotent server-side state transition: `started → email-verified → second-factor-verified → claim-pending → approved → active`, with `rejected/expired` outcomes. A newly registered identity can have pending access to *its own application only*, not to an existing partner or certified widgets before claim approval.
7. On approval a trusted service creates the organization/establishment membership and scoped access grants in DNS Core; existing `users`, `memberships`, `accessGrants` stay authoritative. Include multi-user invitations/delegations and multi-establishment ownership later, not a password shared by all hotel staff.
8. Record source, timestamp and verification of bed capacity; require a period-effective capacity revision. Unknown is distinct from 0; declaration does not constitute licensing verification.
9. Handle legitimate duplicate claims, company transfers, email changes, staff turnover, hotels without official domain and loss of second factor through a documented DNS recovery/approval workflow with audit history.
10. Compliance: explicit versioned acceptance of terms/privacy notices, separate consent for optional marketing, data minimization, storage/retention rules and regional authorization.

**Security acceptance gates:** public URL alone cannot claim a property; two factors are independent; OTP cannot be replayed; expired challenge, cross-hotel claim, concurrent activation and unauthorized membership creation fail; successful claim is reviewer- or trusted-ownership-approved; password never leaves identity provider; all activation outcomes are audited without logging OTPs.

**Delivery boundary:** defining this onboarding workflow does not make it live. Backend endpoints, Firebase Auth configuration, transactional notifications, Firestore Rules, recovery workflows and end-to-end emulator tests must pass review before activation.

## 10. Operational quality and migrations

- Retain existing legacy portal's informational/editorial pages but reorganize: public About DNS (vision/values), publicly permitted brand materials and quality/benefits; private Dashboard, My Establishment, Tools & Services, Materials; assistance. Distinguish public from authenticated views.
- Move territorial operational toolbox responsibilities to DNS Workspace; don't clone Analytics/FAIR/Data Entry.
- Initial imports: map old form answers and partner lists to canonical establishments with duplicate review and explicit source/date. No automatic certification or historical inference.
- Durable idempotent event publication with retry/dead-letter/reconciliation; nightly aggregate integrity check; season-specific immutable snapshots for FAIR. Use as-needed modular implementation, not speculative microservices.
- Required acceptance tests: authorization isolation, lifecycle + accreditations, criteria version change preserving old decisions, event replay, capacity history, area reassignment history, FAIR snapshot reproducibility, widget design update without embed replacement, revoked seal, blind-voucher nominal-data egress test, email failure handling, data import deduplication, DE/IT/EN.
- Backup, restoration drill, schema migrations with backward compatibility, audit logs, observability, export/erasure workflows and role privacy documentation precede production rollout.

## 11. Work phases / release gates

**Phase 0 — present contract and security audit:** Review current deployed Firebase Rules/backend; reconcile FAIR definitions, partner source register, legal/privacy roles and legacy dataset.
**Phase 1 — platform contracts:** Extend existing Shared Data organizations/access contracts additively; establishment and partnership services, history/event schemas, source quality, import/reconciliation, durable publication. No production writes before rules/tests.
**Phase 2 — management & portal foundation:** Workspace Partner Management dashboard and case flow; Foundation-native Partner Hub public and private shells, profile, criteria/evidence UI, communications.
**Phase 3 — certified/public Widget Runtime:** Server-certified seal, centrally updated rendering, telemetry and live trail source validation.
**Phase 4 — Blind Voucher:** Replace legacy voucher + email backend with privacy-minimized architecture and testing.
**Phase 5 — Analytics & FAIR:** publish verified canonical per-area season counts, historical dashboards/heatmaps, bed capacity, FAIR consumption without algorithm changes.
**Phase 6 — elective modules:** Benefits, recruiting, bookings, tourism, occupancy/overnight stays and economic analysis only after approved scope and availability.

## 12. Open decisions requiring explicit sign-off

1. Final legal approval of quality criteria, transition/grace rules and mandatory certified widget; physical sign proposed for retirement.
2. Definition of active partner counts for FAIR, effective snapshot date and multi-site/multi-area mapping.
3. Official partner-source list merge and authoritative establishments' bed capacity source.
4. Whether/how DNS handles any guest-related personal data; use hotel-controlled guest records by default.
5. Privacy terms, retention, communication preferences, cross-border hosting and policy for evidence files.
6. Official Contwise/trail data integration license, attribution, freshness and schema.
7. Repository rename and dependency/deployment migration plan.
8. Detailed source-of-truth runtime architecture for shared DNS authentication and operational database.

**NON-GOALS of this document:** It does not certify compliance, deploy backend services, enable certifications, issue real badges, modify existing FAIR calculations, claim live map data, or switch production voucher storage.
