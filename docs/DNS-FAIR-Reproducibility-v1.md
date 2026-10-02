# DNS FAIR Reproducibility & Approval Contract v1.0

**Status:** normative Foundation contract; persistence implementation pending  
**Owner:** FAIR for model parameters/results; source-domain owners for operational facts  
**Goal:** make every approved FAIR season exactly explainable and reproducible.

## 1. Core rule

FAIR must never depend, for an approved season, on mutable live inputs whose later correction can silently change the historical contribution calculation.

Operational systems may remain live. FAIR approval freezes a versioned snapshot of the exact inputs used.

## 2. Required approval chain

```text
authoritative operational sources
→ FAIR candidate input snapshot
→ review / validation
→ APPROVED FAIR input snapshot
→ FAIR engine
→ FAIR candidate result
→ approval
→ APPROVED FAIR result snapshot
```

The FAIR calculation engine itself remains application-owned and is not redefined by this contract.

## 3. Approved input snapshot

An approved FAIR input snapshot must record at minimum:

- `snapshotId`
- `seasonId`
- `revision`
- `status`
- `canonicalDatasetVersion`
- `fairModelVersion`
- exact input records/values used by the FAIR engine
- source provenance for each input family
- source revision or immutable source reference where available
- `createdAt`
- `createdBy`
- `approvedAt`
- `approvalRef`
- integrity hash/checksum over the normalized snapshot payload

The snapshot must be immutable after `approved`.

## 4. Approved result snapshot

The result snapshot must reference the approved input snapshot and contain at minimum:

- `resultSnapshotId`
- `inputSnapshotId`
- `seasonId`
- `revision`
- `canonicalDatasetVersion`
- `fairModelVersion`
- contribution/result rows exactly as approved
- total/check figures required for validation
- `approvedAt`
- `approvalRef`
- integrity hash/checksum

## 5. Status model

Allowed snapshot statuses:

```text
draft
review
approved
superseded
```

Rules:
- `draft` and `review` may be replaced by newer revisions.
- `approved` is immutable.
- a later correction creates a new revision; it does not mutate the approved record.
- `superseded` preserves the old snapshot and links to the newer approved revision.

## 6. Provenance

Each FAIR input family must identify its source. Typical types include:

- `analytics`
- `data-entry`
- `fair-manual`
- `ticketing`
- `import`
- `system`
- `external-source`

Where a source owns finer-grained Destination data but FAIR needs Reporting Area values, aggregation must be reproducible from the snapshot and must not destroy the finer-grained source records.

## 7. Canonical dependency

Every approved snapshot must pin the canonical dataset version used for:
- Reporting Areas;
- Destination → Reporting Area mappings;
- Organization references;
- relevant aliases/mappings.

Later canonical releases cannot change the meaning of an already approved FAIR snapshot.

## 8. Approval boundary

Technical validation is not institutional approval.

The system may verify:
- completeness;
- totals;
- source revisions;
- schema validity;
- integrity hashes;
- impact differences.

The system must not infer institutional approval. An approval record/reference is required.

## 9. Historical reproducibility test

Given an approved input snapshot, the matching FAIR model version and the referenced canonical dataset version, the calculation must be reproducible without reading mutable live operational data.

## 10. Persistence target

Target Foundation collections (implementation pending):

```text
fairInputSnapshots
fairResultSnapshots
```

No Firebase write behavior is introduced by this specification alone.
