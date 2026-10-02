# DNS Foundation propagation and release policy

**Canonical source:** `dolomitinordicski/dns-shared-data`  
**Current package baseline:** `1.1.2`  
**Consumer scope:** Data Entry, Polls, FAIR, Analytics, and Faktura  
**Out of scope for this rollout:** Flyer Studio, Partner Portal, legacy tools, and the Hub launcher.

## One release for Foundation and Design System

The Foundation package is the versioned delivery unit for shared runtime, Design System tokens, UI primitives, localization, capabilities, and canonical assets. The `DNS_DESIGN_SYSTEM.version` value remains visible as a component version, while the Foundation SemVer release pins the exact complete package consumers install.

A consumer must depend on an immutable Git tag:

```json
"@dolomitinordicski/dns-shared-data": "github:dolomitinordicski/dns-shared-data#foundation-v1.1.2"
```

Do not use `main`, a moving branch such as `release/v1.1.2`, or a raw commit SHA as the normal consumer pin. The old `release/vX.Y.Z` branches are historical and are not immutable release artifacts.

## Release flow

1. Implement and review shared changes in `dns-shared-data`.
2. Update `package.json.version` according to SemVer and update the component version in `src/design-system.ts` when its public token contract changes.
3. Let `Validate DNS Shared Package` pass on the pull request and merge to `main`.
4. Run **Release DNS Foundation** with the exact package version. It rebuilds/typechecks/packs the package, confirms the requested version matches `package.json`, refuses an existing tag, and creates the immutable `foundation-vX.Y.Z` GitHub Release.
5. Consumers check for the latest published stable release weekly and on manual dispatch. Each consumer updates only its Foundation dependency, runs its existing validation/build, and opens or refreshes one reviewable PR.
6. The consumer pin check requires a `foundation-vX.Y.Z` tag. The existing deploy/build workflow remains the final PR gate.

The release is not silently injected into a live tool: Foundation changes reach a consumer through a tested PR that is reviewed and merged. That keeps every production build reproducible and gives the tool owner control over rollout timing.

## Versioning

- **MAJOR**: breaking shared runtime, exported API, Design System, or contract behavior.
- **MINOR**: backward-compatible shared capability or token addition.
- **PATCH**: backward-compatible fix, correction, or asset repair.

Never move or recreate an existing `foundation-vX.Y.Z` tag. Publish a new SemVer release for every correction. Existing consumer migrations must not change domain engines, calculation logic, Firestore models, approved snapshots, or accounting logic as a side effect of dependency updates.

## CI and failure handling

- Foundation CI builds the distributable package, typechecks it, verifies package contents, and checks browser mirrors/contracts.
- Release CI repeats the package gates before tagging.
- Consumer update automation opens a PR only after install plus the consumer's existing validation/build passes.
- A failed consumer build leaves its current pin in place and reports the failure in Actions.
- The weekly check is a safety net; a maintainer may dispatch the update workflow immediately after publishing a release.

## Current release bootstrap

The repository currently declares Foundation package version `1.1.2`. The existing `release/v1.1.2` reference is a branch, and the consumer manifests contain commit pins. After this policy is merged, publish `foundation-v1.1.2` once from the validated current main commit, then let the consumer update PRs move the existing tools to that immutable release.
