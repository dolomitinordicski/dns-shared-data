# DNS Operational Runbook v1.0

**Status:** operational handover baseline  
**Audience:** DNS technical/operational maintainers  
**Purpose:** answer "what do I do when I need to operate or recover the system?"

This runbook intentionally avoids storing secrets. Secret locations must be referenced, not copied here.

## 1. Ownership & access

Record and keep current:

| Item | Owner | Recovery contact | Controlled credential location | Status |
|---|---|---|---|---|
| GitHub organization | TO ASSIGN / VERIFY | TO VERIFY | shared DNS password manager / controlled record | incomplete |
| Google Cloud / Firebase DNS_Core | TO ASSIGN / VERIFY | TO VERIFY | shared DNS password manager / controlled record | incomplete |
| Polls Firebase / PII domain | TO ASSIGN / VERIFY | TO VERIFY | controlled record | incomplete |
| GitHub Pages domains | TO ASSIGN / VERIFY | TO VERIFY | controlled record | incomplete |
| DNS domains / DNS records | TO ASSIGN / VERIFY | TO VERIFY | controlled record | incomplete |

No production system is considered handover-ready while ownership or recovery access is unknown.

## 2. Recurring operations

### 2.1 Add a season

**Input**
- approved season ID in `YYYY-YY` format;
- intended status (`future`, then `active` when applicable).

**Procedure**
1. update canonical season definition in `src/canonical-data.ts`;
2. validate no duplicate ID/alias;
3. run package validation;
4. merge through reviewed PR;
5. deploy/seed operational configuration only through the dedicated workflow for that domain;
6. verify all consumers resolve the new season from shared data.

**Verify**
- shared package validation green;
- canonical page/status shows the new season;
- no consumer carries an independently edited season copy.

### 2.2 Update PN / KP / ticket sales

Use the domain-specific controlled import/data-entry path. Do not edit approved historical snapshots.

**Verify**
- source provenance recorded;
- season and canonical scope IDs are correct;
- submission/revision status is visible;
- Analytics consumes the authoritative operational source.

### 2.3 Prepare and approve FAIR

1. validate authoritative source inputs;
2. create FAIR candidate input snapshot;
3. verify canonical dataset version and FAIR model version;
4. review differences vs previous candidate/revision;
5. obtain required approval;
6. freeze approved input snapshot;
7. calculate FAIR from that snapshot;
8. freeze approved result snapshot;
9. record approval reference;
10. verify Faktura/management views consume the approved result revision.

Never re-read mutable live inputs to reconstruct an approved historical FAIR result.

### 2.4 Publish a shared Foundation/canonical change

1. classify the change under `DNS-Canonical-Change-Control-v1.md`;
2. create traceable proposal;
3. for MAJOR changes, attach FAIR impact simulation and approval reference;
4. create branch/PR;
5. run validation;
6. merge only when required approvals are satisfied;
7. verify Pages/package deployment;
8. update changelog/release metadata;
9. verify consumer drift status.

### 2.5 Add or update a shared asset/logo

1. add the canonical asset to the shared asset location;
2. update canonical manifest/metadata;
3. do not copy the file into consumer repositories unless explicitly exempted;
4. merge/deploy Shared Data;
5. verify the public asset URL;
6. verify consumers by canonical reference.

## 3. Common failure modes

### Shared package validation fails
**Symptom:** `Validate DNS Shared Package` red.  
**Likely causes:** stale browser mirror, export/package mismatch, typecheck failure.  
**Fix:** inspect the first failed validation step; update the canonical source and its required generated/mirror artifact together. Do not bypass the check.

### GitHub Pages deploy fails
**Symptom:** latest Pages run red or live site remains on previous commit.  
**Fix:** inspect build before deploy; confirm package pin/import exists; confirm asset path is included in deploy trigger/artifact.

### Consumer drift
**Symptom:** one tool looks/behaves differently or uses an older Foundation SHA.  
**Fix:** compare consumer dependency pin and local fallback/duplicate primitives against current Foundation. Do not patch visual behavior locally as the first response.

### Missing data breaks Analytics
**Symptom:** module state/error or incomplete chart.  
**Fix:** identify source contract and provenance; correct/import source through the owning domain. Do not hardcode a UI-only replacement for production data.

### Firebase auth/access issue
**Symptom:** authenticated user cannot read expected scope or admin operations fail.  
**Fix:** verify Firebase project, user profile, membership, access grant and rules separately. Do not relax production rules globally as a permanent fix.

## 4. Do NOT touch

Without explicit migration/change-control:

- canonical IDs already used in production;
- approved FAIR input/result snapshots;
- historical season records by destructive overwrite;
- legacy mappings still required for historical readability;
- official accounting records in XGLA4;
- Poll PII outside the Polls purpose/domain;
- calculation engines while performing Foundation/UI consolidation;
- Firebase security rules merely to work around a frontend defect.

## 5. Backup & recovery

The following must be documented before handover is complete:

- Firestore backup/export location and cadence — **TO VERIFY**;
- restore procedure and responsible owner — **TO VERIFY**;
- canonical repository backup/export — Git history is primary, additional institutional archive **TO DEFINE**;
- seasonal approved FAIR snapshot export — required once persistence is implemented;
- shared asset archive/recovery — **TO DEFINE**.

A backup is not considered valid until a restore procedure has been tested.

## 6. GDPR / PII operations

Maintain controlled procedures for:
- Poll participant deletion/anonymization;
- account/access revocation;
- retention expiry;
- processor/DPA records;
- incident/recovery escalation.

Public documentation must never include personal records or credentials.

## 7. Contacts

Keep the actual names/addresses in a controlled operational contact sheet.

Required roles:
- DNS operational owner;
- GitHub organization owner/recovery;
- Google Cloud/Firebase owner/recovery;
- data steward;
- Vorstand/data-governance approver contact;
- technical escalation/support provider;
- external technical validation/support where formally assigned.

## 8. Minimum glossary

- **Reporting Area** — territorial DNS network unit used for shared network/reporting logic.
- **Destination** — geographic/tourism unit linked to a Reporting Area.
- **Organization** — real institutional/commercial actor; not the same as geography.
- **Canonical ID** — stable technical identifier, language-independent and non-destructively maintained.
- **Season** — canonical `YYYY-YY` operational time reference.
- **FAIR input snapshot** — immutable approved set of exact inputs used for a FAIR calculation.
- **FAIR result snapshot** — immutable approved output linked to one approved input snapshot.
- **Source of truth** — authoritative owner/location for a datum; consumers reference rather than maintain independent editable copies.

## 9. Handover readiness

The system is not handover-ready until:
- ownership/recovery is assigned;
- recurring operations are tested by someone other than the primary maintainer;
- backup restore is tested;
- FAIR snapshot approval flow is implemented;
- PII retention/deletion procedures are recorded;
- current-vs-target status is maintained automatically or by explicit release process.
