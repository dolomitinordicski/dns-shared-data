# DNS Data Governance & Compliance Register v1.0

**Status:** Foundation governance register  
**Rule:** public repository stores policies, boundaries and verification status only. It must not store credentials, confidential DPAs, personal data or secret recovery information.

## 1. Verification states

- `verified` — checked against authoritative configuration/documentation.
- `declared` — documented operationally but not independently verified in this repository.
- `to-verify` — required information not yet recorded.
- `not-applicable`.

## 2. Domain register

| Domain | Data class | PII | Runtime / project | Hosting region | Retention | Deletion procedure | DPA / processor record | Backup / recovery | Status |
|---|---|---:|---|---|---|---|---|---|---|
| DNS canonical master data | public/non-sensitive reference | no | dns-shared-data + DNS_Core | Milan/EU declared; exact resource config to verify | versioned history retained | canonical change-control | n/a for public repo; Google processor record to verify for DNS_Core | export/recovery procedure to document | partial |
| DNS Platform operational data | operational | potentially account-linked | DNS_Core | Milan/EU declared; exact resource config to verify | to define by collection | to document | to verify | to document | partial |
| DNS Polls | privacy-sensitive poll data | yes | separate Polls / PII domain | to verify | to define | required per poll/purpose | to verify | to document | incomplete |
| FAIR approved snapshots | institutional/financial basis, no PII required by contract | no by design | target platform persistence | to verify at implementation | retain approved seasonal snapshots | immutable; corrections via new revision | depends on runtime | export + restore required | specified / not implemented |
| Billing Preparation | commercial operational data | potentially organization/account-linked | DNS_Core / commercial workflow | to verify | to define | append/revision rules; official accounting remains external | to verify | to document | partial |
| Partner Portal identity/access | account + membership/access data | yes | DNS Platform | to verify | to define | account/access revocation procedure required | to verify | to document | Foundation-defined |
| Flyer Studio user/project data | potentially account-linked assets/projects | potentially | application/shared platform target | to verify | to define | project/asset deletion policy required | to verify | to document | planned |

## 3. Required compliance records outside the public repo

The operational owner must maintain, in an access-controlled location:

- Data Processing Agreement / processor terms;
- controller/processor responsibilities;
- Google Cloud/Firebase project ownership;
- exact data-location configuration;
- retention decisions;
- data-subject deletion procedure where PII exists;
- backup/recovery credentials and locations;
- incident/recovery contacts.

This repository should only point to those controlled records by non-secret reference.

## 4. Polls minimum rule

Poll participant identity/contact data is purpose-bound to the specific poll and must not automatically become reusable contact/master data.

Before Polls is considered compliance-complete, record:
- exact Firebase region;
- retention period after poll closure;
- deletion/anonymization procedure;
- administrator procedure for data-subject requests;
- backup policy compatible with deletion obligations.

## 5. Exit strategy

For every persistent domain, document:
- export format;
- canonical IDs preserved in export;
- attachment/asset export path;
- procedure to reconstruct minimum operational state outside Firebase;
- dependencies that cannot be exported trivially.

The objective is not an immediate migration away from Google. It is to avoid undocumented lock-in.

## 6. Review cadence

Review this register:
- before each new production data domain;
- before material Partner Portal rollout;
- before introducing new PII collection;
- at least once per operational season.

