# DNS Foundation v1.2

**Dolomiti NordicSki Digital Platform**  
**Status:** Foundation Specification  
**Date:** 30 September 2026  
**Canonical Dataset:** v1.6  
**Source of truth repository:** `dolomitinordicski/dns-shared-data`

---

## 1. Purpose

DNS Foundation v1.2 defines the common architecture, data boundaries and ownership rules for the Dolomiti NordicSki digital ecosystem.

It is the architectural reference for current and future DNS tools, including:

- Partner Portal & Hub
- FAIR
- Analytics
- Ticket Orders
- Billing Preparation
- Polls
- Flyer Studio
- QR tools
- future partner, B2B and internal operational tools

The Foundation does not define one application.

It defines the shared system that multiple applications participate in.

---

## 2. Core architectural principle

DNS applications must not invent their own independent master data when the underlying real-world entity already exists in the shared model.

The guiding rule is:

```text
model real entities
not application screens
```

A new frontend does not automatically require a new Firebase project or a new data model.

A new data domain is justified only when there is a meaningful boundary related to:

- security;
- privacy;
- public data collection;
- financial/administrative workflows;
- data ownership;
- operational independence.

---

## 3. Shared source of truth

The canonical technical source of truth is:

```text
dolomitinordicski/dns-shared-data
```

This repository owns:

- canonical DNS IDs;
- canonical Reporting Areas;
- canonical destinations;
- canonical organisations;
- shared aliases and legacy mappings;
- canonical seasons;
- architectural foundation documents.

Application repositories may consume these definitions.

They must not silently fork or redefine them.

If an application temporarily vendors a snapshot, the snapshot must retain a reference to the canonical version and must not become independently editable.

---

## 4. Public repository boundary

`dns-shared-data` is public.

It must therefore contain only non-sensitive shared master data and architecture documentation.

It must never contain:

- personal email addresses;
- poll participant data;
- credentials;
- API secrets;
- authentication tokens;
- fiscal data;
- bank data;
- invoice data;
- payment data;
- confidential contractual data.

---

## 5. Canonical entities

The shared model distinguishes the following concepts.

```text
Reporting Area
= territorial DNS network unit

Destination
= geographic/tourism unit

Organization
= real institutional/commercial actor

Relationship
= how an organization relates to DNS

User
= individual person

Membership
= which organization a user represents

Access Grant
= what a user may access

Season
= temporal reference

Analytical Scope
= level at which a measurement is stored
```

These concepts must not be collapsed into a single generic “partner” entity.

---

## 6. Canonical IDs

Canonical IDs are technical identifiers.

They use:

```text
lowercase
ASCII
kebab-case
stable
language-independent
```

Examples:

```text
drei-zinnen
ahrntal
val-comelico
tvb-osttirol
toblach
2026-27
```

This does not affect display names.

Example:

```json
{
  "id": "toblach",
  "name": {
    "de": "Toblach",
    "it": "Dobbiaco",
    "en": "Toblach"
  }
}
```

The application shows a properly capitalised/localised name.

The database stores the stable canonical ID.

---

## 7. DNS Reporting Areas

The eight canonical DNS Reporting Areas are:

```text
osttirol
drei-zinnen
cortina-d-ampezzo
val-comelico
gsiesertal-welsberg-taisten
antholzertal
ahrntal
seiser-alm-dolomites-val-gardena
```

Human-facing canonical names are:

```text
Osttirol
3 Zinnen Dolomites
Cortina d'Ampezzo
Val Comelico
Gsiesertal / Welsberg / Taisten
Antholzertal
Ahrntal
Seiser Alm Dolomites Val Gardena
```

These are territorial/network entities.

They are not automatically legal organisations.

---

## 8. Reporting Area vs organization

A Reporting Area and the organisation representing or operating within that area are separate entities.

Example:

```text
Reporting Area:
Osttirol

Organization:
Tourismusverband Osttirol
```

Canonical IDs:

```text
reportingAreas/osttirol
organizations/tvb-osttirol
```

This distinction is permanent.

The same principle applies throughout the DNS network.

---

## 9. Destinations

Destinations provide a more granular geographic layer beneath or within Reporting Areas.

Example:

```text
3 Zinnen Dolomites
├── Toblach
├── Innichen
├── Sexten
├── Niederdorf
└── Prags
```

A destination may have:

- one or more organisations;
- accommodation partners;
- ski schools;
- operational data;
- analytical measurements.

Destinations are geography, not actors.

---

## 10. Organizations

`organizations` represents any real actor interacting with DNS.

Initial organization types include:

```text
network-operator
tourism-organisation
accommodation
ski-school
sports-organisation
service-provider
technology-provider
mobility-provider
institution
sponsor
b2b-partner
other
```

The model is intentionally open-ended.

Future B2B categories must be addable without changing the architecture.

---

## 11. Organization type vs relationship

What an organisation **is** is separate from how it relates to DNS.

Example:

```text
organizationType:
accommodation

relationshipType:
accommodation-partner
```

or:

```text
organizationType:
mobility-provider

relationshipType:
b2b-partner
```

An organisation may hold several relationships simultaneously.

Initial relationship vocabulary includes:

```text
dns-member
fair-contributor
regional-manager
b2b-partner
accommodation-partner
ticket-reseller
supplier
technology-partner
marketing-partner
sponsor
```

---

## 12. Verified vs provisional organisations

Not every current FAIR or Analytics label is guaranteed to correspond exactly to a verified legal entity.

Therefore organisations may have:

```text
identityStatus: verified
```

or:

```text
identityStatus: provisional
```

A provisional record may be used operationally for mapping and migration.

It must not be treated as an authoritative legal/fiscal identity until verified.

---

## 13. Users

A user represents a person.

A user is not the same thing as an organisation.

The Portal must support users belonging to many possible kinds of organisations, including:

- DNS management;
- tourism organisations;
- accommodation partners;
- ski schools;
- ticket resellers;
- suppliers;
- external B2B partners;
- future partner categories.

Therefore user access must not be designed around one generic role called `partner`.

---

## 14. Memberships

Memberships connect a user to an organisation.

Conceptually:

```text
user
  ↓
membership
  ↓
organization
```

One user may represent more than one organisation.

Example:

```json
{
  "userId": "firebaseUid",
  "organizationId": "hotel-example",
  "role": "manager",
  "active": true
}
```

---

## 15. Access Grants

Membership answers:

```text
Who does this person represent?
```

Access Grant answers:

```text
What may this person use?
```

Possible service access includes:

```text
portal
voucher
ticketOrders
flyerStudio
analytics
fair
billingPreparation
pollsAdmin
```

This allows the Partner Portal to serve many kinds of users without redesigning the database.

---

## 16. Partner Portal role

The Partner Portal is an access layer.

It is not the owner of canonical DNS master data.

Its role is to:

- authenticate users;
- determine memberships;
- determine access grants;
- expose relevant DNS tools;
- provide shared brand/assets/services;
- act as the central operational entry point.

Canonical data lives in `dns-shared-data` and, when persisted operationally, in the shared DNS Platform data domain.

---

## 17. Analytics scope model

Analytics must support data at different levels.

Initial canonical scope types are:

```text
network
reportingArea
destination
organization
```

A measurement should identify at minimum:

```text
seasonId
metricId
scopeType
scopeId
value
source
```

Example:

```json
{
  "seasonId": "2025-26",
  "metricId": "overnights",
  "scopeType": "destination",
  "scopeId": "val-gardena",
  "value": 1601487
}
```

This avoids using free-text labels such as `3ZD - Toblach` as permanent keys.

---

## 18. Analytics integration requirement

The current production Analytics application and the additional analytical modules developed separately must be merged non-destructively.

The integration must preserve:

- existing Firebase data;
- existing historical values;
- existing production configuration;
- current dashboards and calculations unless explicitly superseded;
- new modules added in the extended Analytics version.

No destructive replacement is allowed.

The integration sequence is:

```text
inventory production Analytics
inventory extended Analytics
map datasets and calculations
map legacy names to canonical IDs
identify duplicate logic
integrate incrementally
validate calculations
merge
deploy
```

---

## 19. FAIR ownership

FAIR owns:

- FAIR model parameters;
- manual FAIR-specific inputs;
- FAIR scores;
- FAIR contribution calculations;
- approved FAIR results.

FAIR does not own general operational metrics merely because it uses them.

---

## 20. Analytics ownership

Analytics owns or presents operational analytical facts such as:

- overnight stays;
- ticket quantities;
- ticket revenue;
- trail/opening metrics;
- snow-reliability metrics;
- network reliability metrics;
- derived analytical models.

Where a value is authoritative in Analytics, FAIR should consume it instead of maintaining an independent copy.

---

## 21. FAIR ↔ Analytics data flow

Preferred relationship:

```text
ANALYTICS
    │
    │ operational facts
    ▼
FAIR
    │
    │ FAIR calculation
    ▼
FAIR RESULTS
    │
    ▼
ANALYTICS / MANAGEMENT VIEW
```

Analytics may display FAIR results.

That does not make Analytics their owner.

FAIR may consume Analytics metrics.

That does not make FAIR their owner.

---

## 22. Aggregation without data loss

Different applications may require different aggregation levels.

Example:

```text
destination: seiser-alm
+
destination: val-gardena
        ↓
reportingArea:
seiser-alm-dolomites-val-gardena
        ↓
FAIR
```

The aggregate must not replace or destroy lower-level Analytics data.

The same rule applies to Ahrntal and other combined Reporting Areas.

---

## 23. Ticket Orders

Ticket Orders is an operational workflow.

A submitted order may contain:

- organization reference;
- billing profile reference;
- contact;
- season;
- ordered products;
- quantities;
- prices;
- status.

Typical workflow:

```text
submitted
→ reviewed
→ approved
→ prepared-for-accounting
→ exported
```

Cancelled orders should normally be retained as historical records rather than physically deleted.

---

## 24. Billing Preparation

The DNS tool is not an invoicing/accounting system.

Its role is to prepare commercial data before transfer into the existing accounting system.

Possible DNS-side entities include:

```text
ticketOrders
billingProfiles
products
priceLists
billingPreparation
billingExports
xgla4References
```

DNS may store an external reference showing that a record has been transferred.

---

## 25. XGLA4 boundary

XGLA4 remains the authoritative accounting system.

DNS does not replace XGLA4.

The target workflow is:

```text
Ticket Order
    ↓
DNS review
    ↓
Billing Preparation
    ↓
XGLA4
    ↓
official invoice / accounting
```

XGLA4 owns authoritative:

- invoices;
- bookkeeping;
- accounting records;
- payments;
- official fiscal customer records where applicable.

DNS may store only the operational references required to connect its workflow to XGLA4.

---

## 26. Polls boundary

DNS Polls remains a separate privacy-sensitive domain.

It may collect:

- participant name;
- participant surname;
- participant email;
- response;
- poll invitation recipients.

Participant email addresses are tied to the purpose of that poll.

They must not automatically become reusable contact records for other DNS applications.

Poll data may reference canonical shared IDs such as:

```text
organizationId
reportingAreaId
seasonId
```

without moving personal poll data into the shared canonical repository.

---

## 27. Public forms

Public forms require narrow write permissions.

Typical examples:

- Poll responses;
- Ticket Orders.

A public form should never receive general read/list access to administrative collections.

Security must be deny-by-default with explicit narrow exceptions.

---

## 28. Shared assets

Brand and operational assets may be referenced through a shared asset model.

Possible metadata:

```text
assetId
type
ownerType
ownerId
language
storagePath
mimeType
createdAt
```

Consumers may include:

- Partner Portal;
- Flyer Studio;
- FAIR;
- Analytics;
- downloads;
- future marketing tools.

---

## 29. Flyer Studio

Flyer Studio must consume shared master data rather than recreate it.

Relevant shared entities include:

- organizations;
- destinations;
- Reporting Areas;
- assets;
- branding;
- seasons.

The same organisation identity should therefore be reusable across Portal, Flyer Studio and future tools.

---

## 30. QR tools

Simple URL-to-QR generation requires no persistent data model.

Persistence is only needed if DNS wants:

- history;
- ownership;
- campaigns;
- reusable links;
- analytics.

Such metadata belongs to the shared operational platform, not to an isolated QR database.

---

## 31. Data provenance

Important measurements should expose their origin where practical.

Example:

```json
{
  "value": 123456,
  "source": {
    "type": "analytics",
    "dataset": "overnights",
    "seasonId": "2025-26"
  }
}
```

Possible source types include:

```text
manual
import
analytics
fair
ticketing
partner-input
system
external-source
```

---

## 32. Seasons

Canonical season IDs use:

```text
YYYY-YY
```

Current canonical seeds include:

```text
2022-23
2023-24
2024-25
2025-26
2026-27
```

Alternative labels such as `WS25`, `2025/26` or `winter-2026` may exist only as display/legacy aliases.

---

## 33. Historical integrity

Historical data must not be silently rewritten when:

- labels change;
- organisations are verified;
- models evolve;
- calculations change;
- apps are refactored.

Where relevant, records should expose:

```text
seasonId
createdAt
updatedAt
version
source
revision
```

Approved/official outputs may additionally require immutable snapshots.

---

## 34. Migration rule

Existing production datasets are not renamed destructively simply to conform to the canonical model.

Migration sequence:

```text
1. define canonical master records
2. define aliases / legacy mappings
3. introduce canonical references
4. preserve legacy readability
5. validate calculations
6. migrate app by app
7. retire old references only when safe
```

This applies particularly to:

- FAIR;
- Analytics;
- Partner Portal.

---

## 35. Shared-data consumption rule

`dns-shared-data` is the authoritative repository.

Application repositories must not maintain independent edited variants of the same canonical dataset.

During migration, an application may temporarily use:

- a generated snapshot;
- a vendored version;
- a direct shared module/package in the future.

Any local snapshot must be treated as derived data, not as source of truth.

---

## 36. Firebase architecture principle

Firebase project boundaries should follow security/data-domain boundaries, not frontend count.

Conceptually:

```text
DNS PLATFORM
├── shared operational/master data
├── FAIR
├── Analytics
├── Partner Portal
├── Flyer Studio
└── shared tools

DNS COMMERCIAL / BILLING PREPARATION
├── Ticket Orders
├── Billing Profiles
├── Products
├── Price Lists
└── XGLA4 export references

DNS POLLS
└── public poll + PII domain

XGLA4
└── authoritative accounting system
```

Exact Firebase project naming may be decided separately.

---

## 37. Source-of-truth ownership

Initial ownership rules:

| Data | Owner |
|---|---|
| Canonical IDs | DNS Shared Data |
| Reporting Areas | DNS Shared Data / Platform |
| Destinations | DNS Shared Data / Platform |
| Organization identity | DNS Shared Data / Platform |
| User membership | DNS Platform |
| Access grants | DNS Platform |
| Overnight stays | Analytics |
| Ticket statistics | Analytics |
| FAIR model parameters | FAIR |
| FAIR contribution/result | FAIR |
| Ticket order | DNS commercial workflow |
| Billing preparation | DNS commercial workflow |
| Official invoice | XGLA4 |
| Accounting/payment status | XGLA4 |
| Poll response | DNS Polls |
| Poll participant email | DNS Polls |

---

## 38. Change control

Canonical IDs remain immutable once used in production and historical readability must be preserved through aliases/mappings.

The normative change-control process is defined in:

```text
docs/DNS-Canonical-Change-Control-v1.md
```

Canonical changes are classified as MAJOR / MINOR / PATCH. Money-moving structural changes require a traceable proposal, FAIR impact simulation, institutional approval and a future effective season. Repository write authority does not substitute for approval authority.

---

## 39. Current known migration issue: Osttirol

Current Analytics contains both:

```text
Osttirol
Osttirol-Obert.
```

The exact scope relationship between these legacy analytical rows must be verified during the Analytics merge.

Until then:

- `Osttirol` is the canonical Reporting Area;
- `Tourismusverband Osttirol` is the canonical organisation;
- `Obertilliach` is a known destination/subarea;
- no destructive assumption is made about historical Analytics rows.

---

## 40. Foundation summary

DNS Foundation v1.2 establishes:

1. one neutral shared source of truth;
2. canonical IDs independent from display names;
3. Reporting Areas separated from organisations;
4. destinations separated from actors;
5. organisation type separated from DNS relationship;
6. users separated from organisations;
7. membership separated from access;
8. Portal support for accommodation and future B2B users;
9. Analytics support for multiple scopes;
10. non-destructive Analytics integration;
11. FAIR and Analytics with explicit ownership boundaries;
12. DNS Billing Preparation separated from invoicing/accounting;
13. XGLA4 retained as the accounting authority;
14. Poll personal data isolated from shared master data;
15. app-by-app migration instead of a destructive platform rewrite.

---

## 41. F0 governance layer

The Foundation governance baseline is completed by:

- `DNS-Canonical-Change-Control-v1.md` — canonical decision/change process;
- `DNS-Canonical-Dataset-Changelog.md` — release/change record;
- `DNS-FAIR-Reproducibility-v1.md` — approved FAIR input/result snapshot contract;
- `DNS-Data-Governance-Compliance-v1.md` — public compliance register and verification gaps;
- `DNS-Implementation-State-Policy-v1.md` — current vs target/planned vocabulary;
- `DNS-Operational-Runbook-v1.md` — operational handover baseline.

For approved FAIR seasons, immutable input and result snapshots are required so a historical contribution can be reproduced without reading mutable live operational data.

The typed contract is exported from `src/fair-governance.ts`. Persistence implementation remains a separate controlled step.


---

## 42. F0.5 localization & bilingualism

The normative localization contract is:

```text
docs/DNS-Localization-v1.md
```

Operational DNS user interfaces support:

```text
de — primary / default / fallback
it — secondary
```

Language resolution is Foundation-owned. Applications must not automatically select the UI language from the browser/OS. The resolution order is explicit session choice → authenticated account preference → stored browser preference → German.

UI language is separate from content language. This distinction is required for Partner Portal documents and Flyer Studio authoring, where a German interface may produce Italian or bilingual content.

Foundation owns shared messages and formatting behavior. Tool repositories own only domain-specific vocabulary. Missing Italian text falls back to German; missing text in both supported languages is a development/CI defect.

Canonical IDs remain language-independent. Existing canonical metadata in additional languages may remain for interoperability and does not expand the supported UI-language contract.

The typed contract and formatting helpers are exported from:

```text
src/localization.ts
@dolomitinordicski/dns-shared-data/localization
```

F1 integrates this contract into the unified `initDNSFoundation()` runtime.


---

## 43. F1 unified Core Runtime

The canonical Foundation orchestration runtime is defined in:

```text
src/foundation.ts
docs/DNS-Foundation-Core-Runtime-v1.md
```

Consumers use:

```text
@dolomitinordicski/dns-shared-data/foundation
```

The runtime centralizes Design System CSS variables and shared primitives/content patterns/interaction/motion/navigation/print/footer/accessibility/localization initialization.

The default runtime source is the versioned Shared Data package. Consumer-owned Design System fallbacks, local variable bridges and independent initialization of shared behavior are migration debt and must be removed during the consolidation pass.

F1 does not change any application business or calculation engine.


---

## 44. F2 shell profiles

DNS applications share one Design System and one Foundation runtime but may use one of three canonical structural profiles:

```text
operational
portal
workspace
```

The normative contract is:

```text
src/shell-profiles.ts
src/ui/shell.ts
docs/DNS-Shell-Profiles-v1.md
```

Operational is the default profile for current internal tools. Portal adds account/organization-aware application structure without inheriting Operational tabs. Workspace supports toolbar/canvas/inspector composition while preserving the rule that Foundation governs the authoring environment, not the creative artifact.

Tool repositories may not create independent shell systems or a fourth local shell profile.


---

## 45. F3 print profiles

Foundation print output uses three canonical profiles:

```text
operational-table
report
document
```

The normative contract is:

```text
src/print-profiles.ts
src/ui/print.ts
docs/DNS-Print-Profiles-v1.md
```

Operational Table remains the default for current dense DNS tools. Report provides document-flow geometry for analytical/management output. Document provides formal transactional/document geometry.

`creative-export` is not a Foundation print profile. Flyer Studio creative output remains owned by its authoring/export engine; Foundation governs the editor UI and export controls only.

The legacy direct `DNS_DESIGN_SYSTEM.print` token object is retained temporarily for migration compatibility and must be removed from consumer-specific print setup during consolidation.


---

## 46. F4 motion & interaction semantics

Foundation defines semantic motion intent instead of application-owned durations/transforms.

Canonical motion events:

```text
enter
exit
expand
collapse
modal
drawer
toast
tab
contextChange
loading
```

Canonical interaction roles:

```text
action
selection
toggle
navigation
destructive
```

The normative contract is:

```text
src/motion-semantics.ts
src/ui/semantic-motion.ts
docs/DNS-Motion-Interaction-Semantics-v1.md
```

Motion is functional and restrained. It supports orientation, feedback and continuity; decorative choreography is not part of the DNS Foundation language.

Both `prefers-reduced-motion` and the DNS Accessibility reduce-motion setting are authoritative and must resolve semantic animation to a non-moving final state.

F4 defines modal/drawer/toast motion only. Their focus, Escape, focus-return and overlay behavior belong to F5.


---

## 47. F5 overlays, forms, upload & data UI

Foundation defines common operational UI semantics for overlays, forms, uploads, data controls and application states.

Normative contract:

```text
src/data-ui.ts
src/ui/data-ui.ts
src/ui/overlay.ts
docs/DNS-Data-UI-Overlays-v1.md
```

Overlay accessibility lifecycle (focus trap, Escape policy, focus return) is Foundation-owned. Forms expose required/valid/error/readonly/disabled/dirty/saving/saved states. Upload/drop zones expose idle/dragging/uploading/success/error/disabled states. Shared data controls cover search/filter/sort/pagination/columns/selection/bulk/export.

Tool repositories retain business validation, persistence, query logic, upload destinations and domain workflows.


---

## 48. F6 identity, membership & access UI

Foundation standardizes authenticated-context presentation while preserving the existing access-control model:

```text
User → Membership → Organization
User → Access Grant → Scope/Permissions
```

Normative contract:

```text
src/identity-ui.ts
src/ui/identity.ts
docs/DNS-Identity-Access-UI-v1.md
```

Foundation owns account/organization context presentation, membership/access indicators, organization-switcher UI and session-action presentation. Authentication, credentials, session tokens and authorization decisions remain platform-owned.

Frontend access visibility is never a substitute for Security Rules/server authorization.


---

## 49. F7 assets & workspace

Foundation defines a canonical shared asset metadata model and the workspace authoring environment.

Normative contract:

```text
src/assets.ts
src/workspace.ts
src/ui/assets.ts
src/ui/workspace.ts
docs/DNS-Assets-Workspace-v1.md
```

Asset metadata covers brand, region/organization logos, graphics, icons, photos, templates and documents with stable IDs, ownership, language, usage and lifecycle state.

The future platform `assets` collection is Foundation-defined; persistence implementation remains pending.

Workspace defines toolbar/canvas/inspector/mobile-panel geometry. Foundation governs workspace chrome, identity, language, accessibility, overlays/forms and asset browser presentation. The creative canvas renderer and exported artifact remain tool-owned.


---

## 50. F8 release & freeze

Foundation is frozen as stable release:

```text
Foundation package/runtime  1.0.0
Release ref                 release/v1.0.0
Design System               1.24.0
Data Contracts              0.8.0
Channel                     stable
Status                      frozen
```

Normative release contract:

```text
src/release.ts
docs/DNS-Foundation-Release-Freeze-v1.md
releases/v1.0.0/manifest.json
```

Consumer migrations must pin the stable release ref rather than development `main`, `master` or arbitrary raw commit SHAs.

Freeze preserves the F0–F7 compatibility surface. Future changes follow semantic versioning: PATCH for compatible fixes, MINOR for backward-compatible shared capability, MAJOR for breaking contract changes.

The package remains private/internal to DNS; F8 does not publish to the public npm registry.


---

**End of DNS Foundation v1.2**
