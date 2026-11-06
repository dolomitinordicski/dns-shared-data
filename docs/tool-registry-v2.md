# Hub registry: source, deployment and runtime evidence

## Diagnosis (6 November 2026)

The production Analytics row was checked at `2026-11-06T17:30:30.952Z` and still recorded Foundation 1.2.1. Analytics #55 merged later, at 21:59:58 UTC, commit `ec72a2098672bb2a3618cb9ca639bf40db2edb45`. The Pages deployment completed successfully at 22:01:36 UTC (run 42301224359, deployment 7611817741). Its lockfile resolves stable Foundation 1.3.0 to `6e2401e533d18a222da5efece2b156c8bbb65f1e`. An independent read-only execution of the new observer resolves both main and the successful deployment to Foundation 1.3.0, Shared Data 1.3.0, Design System 1.25.0 and app 3.0.1.

There is already a central `sync-tool-registry.yml` schedule, plus manual/source-change triggers. No second writer is needed. Recent scheduled executions were hours apart despite the hourly cron: schedules are best-effort. The old collector reads only main/package.json, infers shared-data = Foundation, forces Hub to the canonical release without evidence, and overwrites whole records even when sources fail. It does not inspect deployments, lockfiles or release provenance. It mistakes collector access to seasons for tool backend health. Hub already polls every five minutes and on tab visibility; it also has stale hard-coded fallback versions and can resurrect retired tools. The UI does not make evidence age or successful publication explicit.

## Data contract

DNS Core is a Firebase service, not the Shared Data website: app/Foundation versions are marked not applicable, never inferred from the website's Pages deployment. The registry covers all 11 currently registered entries; deliberately retired repositories are not silently reintroduced.

The full unauthenticated local dry run exercised all entries and exposed GitHub 403 rate limits after the first repositories. These are reported as stale/unknown, not converted into versions. Workspace has no usable npm lock entry and FAIR has a tag/lock mismatch in the observed source; neither is silently changed. Production activation requires the read-only App token and a review of every resulting error. Alternative lockfile formats/build manifests remain unknown until adapters are implemented.

`toolRegistryPublic/{id}` keeps compatible `versions` and `health` fields, adding `observations`:

- `main`: immutable default-branch SHA and the package/lockfile at that SHA.
- `production`: package/lockfile at a successful deployment SHA in the configured production environment (`github-pages` by default). It is never copied from main or inferred from green CI. The latest deployment attempt is stored separately, so a failed attempt does not replace the earlier successful one.
- `deployment.latest` / `deployment.successful`: environment, state, SHA, timestamp, public URL and log URL. Preview/transient deployments and inactive status are not proof of a currently serving deployment. When evidence is missing, previous verified evidence is retained and explicitly marked stale. Provider history is bounded to 100 deployments; absence beyond that bound is reported as incomplete.
- `release`: latest stable application release, resolved tag SHA and publication date; no GitHub release means unknown release, not the latest merge date.
- `dependency`: declared stable tag, exact resolved lock SHA and shared package version. The tag must resolve to the lock SHA before component versions are trusted. Foundation release comes from src/version.ts; Design System from its own exported version; Shared Data from the installed package's lock entry. They are independent values.
- `installationVerified:false`, `runtimeUsage:'unknown'`: a lockfile at a deployed commit is evidence of the locked source, **not an attestation of npm's installed tree or use of that component in the live bundle**. Current tools do not publish a uniform signed build manifest. Hub labels this limitation instead of claiming it away. Adding build/runtime attestations to consumers is a separate rollout, without changing their operational versions in this PR.
- `quality`, `errors`, `preserved`, `lastSuccessAt`, `lastObservedAt`: preserve provenance and distinguish incomplete/old/unavailable data. Web HTTP 200 proves reachability only; per-tool Firebase operation remains pending until a dedicated read-only probe exists.

Canonical available versions come only from a published stable Foundation release and its exact tag SHA; package and component versions are read independently. Discovery failure fails closed before any write. No fallback source is presented as verified.

## Triggering and central ownership

One existing workflow is extended with release, completion of Foundation propagation, allowlisted `repository_dispatch` (`dns-tool-registry-changed`), registry source changes and 15-minute reconciliation. A signal carries only `{repository: 'dolomitinordicski/<registered-repo>'}`. Its contents never become version/deployment facts: all facts are reread from GitHub. Concurrent events serialize, and unchanged observations do not produce history. An hourly heartbeat updates freshness without generating a version-history entry. No workflow dispatches dependency updates, hence no propagation loop.

GitHub `workflow_run` is repository-local. **A deploy in another repository will not magically trigger this workflow.** For immediate notifications, a trusted central GitHub App/webhook forwarder must send the allowlisted dispatch on `push`, `release`, and `deployment_status` (including failure). No consumer needs Firebase credentials. Until such a forwarder is configured and authorized, every registered repository is covered by periodic reconciliation, with best-effort latency rather than instantaneous delivery. This PR prepares the receiver and validates its trust boundary; it does not deploy a webhook service, alter App permissions, or claim that the forwarding bridge already exists.

The existing Foundation propagation App credentials are reused only centrally to request a short-lived **read-only** token (`contents:read`, `deployments:read`). The App installation must cover registered repositories and already allow those permissions; missing grants yield explicit errors. Never grant `contents:write` for the collector. The Firebase credential remains only in the central environment. Current Admin SDK credentials may be broader than the collector's needs; strict collection-level least privilege cannot be enforced by a general Datastore IAM role alone. Review a dedicated writer identity/service before activation; this PR changes no IAM, secrets, user permissions or rules.

Adding a tool to src/tool-registry.ts triggers reconciliation. Setting visible:false keeps its record/history. Removing a managed entry writes an explicit hidden tombstone, never deletes history or unrelated documents. Registry membership is the allowlist; new arbitrary repositories are not auto-trusted from an event.

## Storage and retention

Collector writes only `toolRegistryPublic` and each tool's `observations` subcollection. A transaction atomically records an observation when content changes and updates the public head; retries are idempotent. Timestamp-only observations are deduplicated, with one public heartbeat per hour. Repeated A→B→A transitions retain distinct history events. History is private to trusted operators under existing rules: no broader public-read rule is introduced. Retention/TTL is not enabled automatically; agree a retention policy before long-term activation. Public records contain only technical metadata, not credentials or private payloads.

## Activation plan — separate authorization required

1. Review and merge the Shared Data and Hub PRs only after specific `AUTORIZZO DEPLOY PR #...` authorization. Validate the module tests, existing typecheck/build and Hub browser fixtures. This preparation does not merge or deploy.
2. Validate the GitHub App's read-only repository coverage and the Firebase writer's actual permissions. Any App/IAM/secret change needs specific separate authorization; do not silently widen access.
3. Run dry mode (`npm run sync:tool-registry -- --output <file>`) first: it initializes no Firebase connection and makes no production writes. Inspect Analytics 1.3.0 and all registered tools. A failed source must stay unknown/stale.
4. With a separate explicit production authorization, set repository variable `DNS_TOOL_REGISTRY_V2_ENABLED=true` and run the existing central workflow. This gate is deliberately absent in production now. Compare before/after records and history, and verify Hub's live listener. No trigger may write while the gate is off.
5. Configure the trusted event forwarder only after its own approval. Without it, document periodic-only mode. Test failed deployment and missed/duplicate events with fixtures before enabling real forwarding.
6. Confirm real consumer installation/runtime usage only after signed build manifests/probes exist. Do not label lockfile evidence as installation attestation.

Rollback: disable the activation variable to stop writes; revert the UI if needed. Keep history. Do not run the old v1 writer over v2 records without an explicit data migration: it would discard provenance and history heads.

## Maintenance

Investigate per-tool `errors`, age >2h and failed latest deployment. Check GitHub API limits/App coverage, environment names and stable tag/lock consistency. Restore unavailable sources before clearing stale evidence. Review registered repository and environment mappings for new tools. Test with `node --test tests/tool-registry-observer.test.mjs`; tests inject GitHub/Firestore adapters and never write to production.
