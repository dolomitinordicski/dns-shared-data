# DNS Canonical Dataset Changelog

This changelog records governed changes to the canonical dataset.

## Legacy baseline

### v1.6 — current pre-governance baseline
- Status: existing canonical baseline before formal F0 change-control adoption.
- Governance note: historical releases before F0 did not use the MAJOR/MINOR/PATCH policy defined in `DNS-Canonical-Change-Control-v1.md`.
- No retrospective approval metadata is invented.

## Release policy from next release onward

Every release must declare:

- release version;
- change class: MAJOR / MINOR / PATCH;
- proposal reference;
- affected entities;
- FAIR impact: yes/no;
- approval reference if MAJOR;
- effective season if MAJOR;
- migration notes;
- release date.

### Template

```md
## vX.Y.Z — YYYY-MM-DD
Class: MAJOR | MINOR | PATCH
Proposal: #...
Affected entities: ...
FAIR impact: yes | no
Approval: <reference or n/a>
Effective season: <YYYY-YY or n/a>

### Changes
- ...

### Migration / compatibility
- ...
```
