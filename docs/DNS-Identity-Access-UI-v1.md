# DNS Identity, Membership & Access UI Contract v1.0

**Status:** normative Foundation contract

## 1. Principle

Identity, representation and authorization remain separate concepts:

```text
User → Membership → Organization
User → Access Grant → Scope/Permissions
```

Foundation renders this resolved context. It does not authenticate users or decide authorization.

## 2. Account context

The UI may show:
- display name;
- email where appropriate;
- global role indicator only when relevant;
- session action.

Foundation never stores credentials, tokens or passwords.

## 3. Organization context

A user may represent zero, one or multiple organizations.

The organization switcher changes active organization context only. It must not silently change UI language.

Account context and organization context remain visually distinct.

## 4. Membership roles

Canonical roles come from the existing access-control contract:

```text
viewer
contributor
reviewer
dns-admin (global role)
```

Generic roles such as `partner` are prohibited.

Membership UI states:

```text
active
inactive
not-yet-valid
expired
```

## 5. Access presentation

Canonical presentation states:

```text
allowed
restricted
no-access
inactive
```

These states are presentation of an already-resolved authorization context.

Frontend visibility is not security enforcement. Firestore/server authorization remains authoritative.

## 6. Portal and Workspace

Portal uses account + organization + access context as a first-class shell element.

Authenticated Workspace applications such as Flyer Studio may use the same account/organization context while keeping their own workspace shell.

## 7. Session action

Foundation owns the presentation of the session action. The host application/auth provider owns actual sign-out/session invalidation.

## 8. Package entries

```text
@dolomitinordicski/dns-shared-data/identity-ui
@dolomitinordicski/dns-shared-data/ui/identity
```

## 9. Boundaries

F6 does not:
- authenticate users;
- issue or refresh tokens;
- calculate Firestore authorization;
- create memberships/access grants;
- replace Security Rules;
- persist credentials or secrets.

## 10. Consumer migration

Portal and authenticated Workspace consumers should replace local account/org/access presentation with the F6 contract while keeping their existing authentication and authorization source.
