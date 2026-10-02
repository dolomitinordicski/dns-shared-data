# DNS Implementation State Policy v1.0

**Status:** normative documentation policy

Architecture documents must distinguish the current implemented state from the intended target.

## Allowed states

- **implemented** — present in production/current main and verified by code, configuration or deployment.
- **partial** — materially implemented, but one or more defined parts remain incomplete.
- **foundation-defined** — contract/specification exists in Foundation, but application/persistence implementation is not complete.
- **planned** — agreed target, not yet implemented.
- **deprecated** — still present for compatibility but must not be used for new work.
- **retired** — no longer used by current consumers; retained only when historical traceability requires it.

## Rules

1. A specification does not make a capability implemented.
2. A green build proves build/deploy health, not functional adoption of every Foundation contract.
3. System Status, architecture pages and management-facing summaries must use the same state vocabulary.
4. A planned Firebase collection must not be described as a current production collection.
5. Historical/legacy paths that remain readable must be labelled deprecated rather than silently omitted.
6. Each migration step should update the relevant state only after verification on `main`.

## Verification evidence

An `implemented` claim should point to at least one of:
- canonical source file/contract;
- successful workflow/deployment;
- production collection/configuration;
- application consumer on current main.

Institutional approval and compliance completion are separate dimensions from technical implementation.
