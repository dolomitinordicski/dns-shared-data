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

## 9A. Existing partner first activation (2026-10-27 simplified decision)

DNS emails an announcement containing a **generic public activation URL** only to the existing associated partner contacts already in DNS's authoritative contact list. This URL grants no privileges on its own.

1. The partner enters **the same registered email address** into the activation page.
2. Backend checks the normalized email against an allowlist of **preapproved, authorized, current partner contacts**, not against unverified emails harvested from a questionnaire or arbitrary website. Use neutral responses to avoid leaking membership; rate-limit attempts.
3. Send a single short-lived, one-time email OTP to that mailbox. After OTP confirmation, bind the verified Firebase Auth user to the matched establishment through a trusted, atomic backend operation. No second OTP by default.
4. If no authorized contact matches, the email maps to multiple establishments, the contact is no longer active, or ownership/authorization is disputed, **do not auto-link**; route to DNS manual review. A shared role mailbox may be used when accepted by DNS, with an auditable account owner/delegation policy.
5. Partner completes their profile (business identifiers, rooms, authorised beds, opening periods, services, privacy notice acceptance); self-declared values never silently overwrite verified values. They create their own password through the identity provider. DNS must never receive or store plaintext credentials.
6. Account activation is independent of formal quality accreditation. Allow self-service onboarding, later staff invitations and password recovery; do not automatically enable certified badges or unrestricted partner writes.
7. OTP token TTL, single-use handling, backend-only claim mapping, one account per verified identity, atomic/idempotent provisioning, logging without OTP codes, and abuse protection remain mandatory.
8. Optional, **future only**: public applicant onboarding for nonmembers uses a distinct application/review flow; no existing-establishment self-claim without proof.

**Status:** contract design only. No automatic grant or OTP backend is deployed by this change. Tests and security review required before production.

## 9B. Legacy form import & widget-first onboarding (2026-10-27 decision)

- Import the existing DNS Self Evaluation responses as **historical self-declarations**, with original timestamps/source/evidence and no automatic accreditation. Match responses to canonical establishments using reviewed references; ambiguous duplicates go to DNS review, never automatic reassignment.
- Existing partner with historical answers: on first login show prefilled data, allow **confirm by section, edit, not applicable**, and collect only missing minimum fields (including authorized beds and opening). Preserve original answer snapshots and source provenance.
- Existing partner without historical answers: guided first-time profile and questionnaire. A new applicant is a separate reviewed application process.
- **Widget-first activation:** partner creates/verifies their account and profile first, then the guided default next step is the **Certified Partner Widget Creator** (where eligible) with area, live information modules, preview, safe stable iframe code, and optional send-to-webmaster support.
- Distinct states: `invited`, `account-activated`, `profile-confirmed`, `widget-created`, `widget-installed-verified`; preserve independent quality accreditation lifecycle. Account activated permits relevant private services; inability to install immediately **must not block access** to the Hub, profile correction or support.
- `widget-created` means persisted configuration exists, not evidence that a site has installed it. `widget-installed-verified` requires technical or human verification and evidence timestamp, subject to freshness/verification windows.
- DNS management dashboard: invitations, account activations, profile confirmations, widget creation, installation verified, pending verification/failures; filter by canonical reportingArea/season and keep historical transitions.
- Public informational widget remains available to non-partners, never with certified seal. Certified widget issuance and seal rendering MUST require server-verified accreditation eligibility; do not award certification merely through onboarding.
- Mandatory use of certified widget for future quality certification remains **working-group pending**. It is neither a currently enforced revocation criterion nor a retroactive obligation.
- Do not introduce double-OTP, manually issued passwords, empty feature panels, guest data collection, or FAIR integration in this tranche.

**Implementation gate:** versioned journey state contract, import provenance, role-scoped tenant access, server-authoritative widget and robust verification; test repeat activation, imported duplicate answers, data confirmation updates, no-widget return visit, noncertified partner and revoked seal.

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
