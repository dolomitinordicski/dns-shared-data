# DNS Canonical Data Change Control v1.0

**Status:** normative Foundation policy  
**Scope:** canonical master data in `dns-shared-data`  
**Effective:** 2026-10-02

## 1. Principle

Canonical data is not ordinary application configuration. Reporting Areas, Destination-to-Area relationships and canonical IDs can influence downstream FAIR calculations and therefore require explicit governance.

The technical source of truth remains `dolomitinordicski/dns-shared-data`. Repository write access does not by itself confer authority to approve economically material changes.

## 2. Change classes

### MAJOR — money-moving

A change is MAJOR when it can alter FAIR allocation or the interpretation of a closed/approved FAIR season, including:
- add/remove a Reporting Area;
- merge or split Reporting Areas;
- move a Destination between Reporting Areas;
- change or replace a canonical Reporting Area ID;
- any equivalent structural change shown by FAIR impact simulation to alter contribution allocation.

**Approval:** Vorstand, or a formally delegated data committee.  
**Implementation:** only after recorded approval.  
**Effective season:** future season only. Never retroactive to an approved season.

### MINOR — additive, non-money

Examples:
- add a new Destination without changing existing FAIR allocation;
- add an Organization;
- add a new shared asset/logo;
- add non-breaking metadata.

**Approval:** data steward under normal review.  
**Requirement:** traced proposal + changelog entry.

### PATCH — corrective/cosmetic

Examples:
- new alias;
- typo correction;
- localized display-name correction;
- metadata clarification with no structural or financial effect.

**Approval:** data steward.  
**Requirement:** changelog entry.

## 3. Required flow

Every canonical change must have a traceable proposal before implementation.

For MAJOR changes:

```text
proposal
→ canonical diff
→ FAIR impact simulation
→ approval record
→ implementation
→ canonical release
→ effective from declared future season
```

For MINOR/PATCH changes:

```text
proposal
→ review
→ implementation
→ changelog
```

A commit must never be the first record that a MAJOR change exists.

## 4. Roles

- **Proposer** — any authorized region, DNS body or contributor may raise a proposal.
- **Data steward** — prepares the canonical diff, validates consistency, prepares FAIR impact simulation and implements approved changes.
- **Approver** — Vorstand or delegated body for MAJOR changes.
- **Repository maintainer** — performs technical merge/deploy. This role may coincide with the data steward, but technical merge authority does not replace approval authority.

## 5. Season immutability

Once a FAIR season is approved:
- its canonical dataset reference is immutable;
- its approved FAIR input snapshot is immutable;
- its approved FAIR result snapshot is immutable;
- later canonical changes apply only to a declared future season.

Corrections to historical records must be append-only and explicitly versioned; they must not silently rewrite the approved basis of contribution calculations.

## 6. Canonical dataset version policy

From the next canonical release after the current v1.6 baseline, use semantic versioning:

- **MAJOR** — money-moving structural change requiring approval and an effective season;
- **MINOR** — additive non-money change;
- **PATCH** — corrective/cosmetic change.

Each MAJOR release record must include:
- proposal reference;
- approval body;
- approval reference/date;
- FAIR impact simulation reference;
- effective season;
- migration notes if applicable.

## 7. Dispute rule

If a Reporting Area or partner disputes classification, the data steward documents the issue and impact but does not unilaterally arbitrate a money-moving outcome. The approving body resolves the classification.

## 8. Public repository boundary

Governance records may reference approval IDs and dates. Confidential minutes, personal data, credentials and sensitive attachments must remain outside the public repository.

## 9. Enforcement target

The Foundation CI should eventually reject:
- MAJOR canonical diffs without required governance metadata;
- retroactive effective-season changes;
- canonical release changes without changelog metadata.

This document defines the policy before that automated enforcement is implemented.
