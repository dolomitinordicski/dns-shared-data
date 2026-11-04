# DNS Version Governance

The DNS platform tracks four related version dimensions:

1. **App** — the individual tool release declared in that repository's `package.json`.
2. **Foundation** — the immutable DNS Foundation release consumed by the tool.
3. **Design System** — the design-system version shipped by the pinned Foundation release or canonical runtime.
4. **Shared Data** — the shared DNS package/data-contract release associated with the Foundation pin.

## App SemVer rules

DNS apps use semantic versioning (`MAJOR.MINOR.PATCH`).

- **PATCH**: fixes, refactors without contract changes, and Foundation dependency updates.
- **MINOR**: backward-compatible user-facing features or new tool capabilities.
- **MAJOR**: breaking changes to tool behavior, persisted contracts, APIs, or incompatible workflows.

Pre-1.0 tools keep the same rules inside the `0.x.y` line until they are declared stable.

## Foundation propagation

A published immutable Foundation tag (`foundation-vX.Y.Z`) is propagated to registered consumers.

For npm-based consumers, the Foundation sync workflow:
1. updates the immutable Foundation pin;
2. increments the consumer app PATCH version deterministically in `package.json` and `package-lock.json`;
3. installs dependencies;
4. runs the consumer's available validate/build/test/lint checks;
5. opens or refreshes the Foundation update PR.

The app version changes only when the Foundation update is actually prepared for that consumer. A consumer that cannot validate the new Foundation keeps both its previous Foundation pin and its previous app version.

## DNS Hub

DNS Hub exposes the deployed relationship between:
- App version
- Foundation version
- Design System version
- Shared Data version

The public registry is synchronized from the repositories into DNS Core. Hub itself is versioned as an app and consumes the canonical Foundation/Design System web runtime.

## Current release relationship

Foundation and Shared Data currently ship on the same shared package release track. Their values can therefore be identical even though Hub displays them separately because they describe different responsibilities.

Design System has its own version track.

## Governance

Do not bump an app version solely to make numbers match another component. Versions identify different layers. The relationship between those versions is the source of truth.
