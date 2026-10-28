# DNS communication access · contract draft

**Status:** proposal for the next Foundation release. Frozen Foundation v1.3.0 is unchanged.

## Canonical identity

DNS Core Firebase Authentication identifies the user. DNS Core Firestore holds
`users/{uid}`, memberships and scoped access grants. The browser must never
assign or override roles. An inactive profile or expired grant gives no access.

## Permissions

| Permission | Use |
| --- | --- |
| `polls.read` | View authorized date-poll administration |
| `polls.manage` | Create, edit and close polls |
| `events.read` | View managed events |
| `events.manage` | Create, edit and close events |
| `registrations.read` | Read event attendees and their answers |
| `registrations.export` | Export personal registration data |

The network-wide `dns-admin` role includes these permissions. Other roles
must obtain explicit DNS Core grants for their assigned network, reporting
area or organization scope. Never grant attendance-data access from a simple
read-only events permission.

## Project boundary and integration

DNS Polls stores private participants in its own Firebase project, `dns-polls`.
A `dns-core` Firebase ID token cannot be used directly in Polls Firestore
Security Rules. Workspace must **not** pass JWTs through URLs or iframes.

A future trusted backend bridge must verify the Core token with the DNS Core
Admin SDK and resolve the user's active scoped permissions server-side.
It may then issue a short-lived Polls-specific custom token or expose a
strictly permission-checked API using the Polls service identity.

All Polls rules must independently validate authorized identity/claims and
scope. Public registrations remain isolated anonymous writes. Bridge design
must account for revocation, audit, session expiry and rate limits.

## Delivery

1. Workspace Core identity/profile view — implemented in Workspace PR #14.
2. Publish this canonical permission vocabulary in a **new** Foundation release.
3. Build and test a small server-side DNS Core → Polls bridge.
4. Migrate Polls to the shared session, then remove the literal-email admin check.
5. Expand to other tools one at a time, without copying user databases.

This document is a **contract, not a working single-sign-on bridge**.
