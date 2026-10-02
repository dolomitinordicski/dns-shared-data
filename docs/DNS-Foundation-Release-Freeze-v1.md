# DNS Foundation Release & Freeze Policy v1.0

**Stable Foundation release:** 1.0.0  
**Release ref:** `release/release/v1.0.0`  
**Status:** frozen / stable  
**Release date:** 2026-10-02

## 1. Release composition

Foundation 1.0.0 freezes the shared contract completed through F7.

Component versions:

```text
Foundation package/runtime  1.0.0
DNS Design System           1.24.0
DNS Data Contracts          0.8.0
```

The component versions remain independently visible inside the Foundation release manifest.

## 2. Freeze meaning

Frozen does **not** mean development stops.

It means that consumer repositories may now rely on Foundation 1.0.0 as a stable compatibility target.

After freeze:
- breaking Foundation contract changes require a MAJOR release;
- backward-compatible shared features require a MINOR release;
- compatible fixes require a PATCH release;
- existing consumer migrations target a stable release, not development `main`.

## 3. Pinning rule

Consumer repositories must not use:
- `main`;
- `master`;
- arbitrary/raw commit SHA references as their normal Foundation dependency;
- copied local Foundation source as a substitute for pinning.

Approved target for this migration wave:

```text
release/v1.0.0
```

For package-based consumers, pin the repository dependency to the stable release ref.

For static consumers, use a stable release/versioned distribution reference. Do not import the mutable Pages root as the long-term production dependency.

## 4. Package visibility

The package remains:

```json
{
  "private": true
}
```

Foundation 1.0.0 is an internal DNS release. F8 does not publish the package to the public npm registry.

## 5. Compatibility baseline

Foundation 1.0.0 includes:
- F0 governance and reproducibility;
- F0.5 DE/IT localization;
- F1 Core Runtime;
- F2 Operational / Portal / Workspace shells;
- F3 print profiles;
- F4 motion/interaction semantics;
- F5 overlays/forms/upload/data UI;
- F6 identity/membership/access UI;
- F7 assets/workspace.

Consumer business engines remain outside the Foundation compatibility promise.

## 6. Frozen interfaces

The following are part of the stable compatibility surface:
- `initDNSFoundation()`;
- shell profile IDs;
- print profile IDs;
- localization language contract;
- motion semantic IDs;
- data UI state/taxonomy IDs;
- identity/access presentation IDs;
- asset/workspace contracts;
- exported package entry points documented by Foundation 1.0.0.

Removing or changing the meaning of these contracts is breaking.

## 7. Consumer migration

Migration order remains:

```text
FAIR
Hub
Polls
Data Entry
Analytics
Faktura
Partner Portal
Flyer Studio
```

Each migration should:
1. pin Foundation 1.0.0;
2. replace local Foundation fallbacks/runtime duplication;
3. preserve tool business/data engines;
4. validate production behavior;
5. remove compatibility bridges only after native Foundation markup/runtime is confirmed.

## 8. Release ref

The canonical release ref is `release/v1.0.0`.

The release branch is created from the final F8 merge commit and is treated as immutable.

If a release branch is used operationally, it must be treated as immutable after creation. Hotfixes create a new PATCH release instead of rewriting the old release.

## 9. Change path after freeze

Examples:

```text
1.0.0 → 1.0.1   compatible bug fix
1.0.0 → 1.1.0   backward-compatible shared capability
1.x   → 2.0.0   breaking contract change
```

Design System and Data Contracts may advance independently, but every Foundation release records exactly which component versions it contains.

## 10. F9 relationship

F8 defines the stable release target.

F9 adds automated consumer auditing/drift enforcement so repositories can be checked against this release and prohibited local Foundation duplication.
