# DNS Access Control v0.1

**Scope:** authentication, memberships, scoped permissions  
**Target runtime:** DNS_Core + Firebase Authentication  
**Status:** authorization baseline before operational browser writes  
**Date:** 1 October 2026

## 1. Principle

Identity and authorization are separate concerns.

- **Firebase Authentication** owns user identity.
- **DNS_Core** stores authorization metadata.
- **Organization** is not a user.
- **Membership** represents a user's relationship to an organization.
- **Access Grant** represents permission over a DNS scope.

No browser client may grant itself access.

## 2. Firestore collections

```text
users
memberships
accessGrants
```

These collections contain private authorization metadata and are never public master data.

## 3. User profile

`users/{uid}` uses the Firebase Auth UID as document ID.

The profile intentionally avoids duplicating personal identity fields such as email unless a later requirement makes that necessary.

Core fields:

```text
id
active
preferredLanguage?
globalRoles[]
```

The only global role in v0.1 is:

```text
dns-admin
```

Global admin access should remain rare.

## 4. Membership

A membership links:

```text
user
→ organization
→ role
```

Roles:

```text
viewer
contributor
reviewer
```

A user may have multiple memberships when operationally justified.

Memberships may optionally be time-limited through `validFrom` / `validTo`.

## 5. Access grants

Membership alone does not define every permission boundary.

An access grant explicitly binds:

```text
userId
scopeType
scopeId
permissions[]
```

Supported scope types follow canonical DNS scopes:

```text
network
reportingArea
destination
organization
```

Examples:

```text
user A
organization: tv-toblach
scope: organization/tv-toblach
permissions: ticketSales.write, kp.write

user B
organization: seiser-alm-marketing
scope: reportingArea/seiser-alm-dolomites-val-gardena
permissions: ticketOrders.write, ticketSales.write

DNS administrator
global role: dns-admin
```

## 6. Permission vocabulary

```text
season.read
season.manage

pricing.read
pricing.manage

ticketOrders.read
ticketOrders.write
ticketOrders.verify

ticketSales.read
ticketSales.write
ticketSales.verify

kp.read
kp.write
kp.verify

verification.read
verification.manage
```

Permissions are deliberately domain-specific. A contributor who may enter sales does not automatically receive pricing administration rights.

## 7. Default role capabilities

### viewer

Read-only operational visibility within granted scope.

### contributor

May enter operational quantities within granted scope:

- ticket orders;
- ticket sales;
- KP.

Pricing remains read-only.

### reviewer

May verify submitted operational data within granted scope, but does not receive pricing or season administration by default.

### dns-admin

Network-level trusted operator with full v0.1 operational permissions, including season and pricing management.

## 8. Firestore read policy

Authenticated users may read only:

- their own `users/{uid}` document;
- membership documents whose `userId` equals their Auth UID;
- access grants whose `userId` equals their Auth UID.

Client writes to authorization collections are denied.

This is enough for applications to build their local authorization context without exposing another user's grants.

## 9. Operational writes

v0.1 does **not** yet open writes to:

- pricingConfigs;
- ticketOrders;
- ticketOrderLines;
- ticketSales;
- kpEntries;
- seasonalSubmissions;
- operationalRevisions.

Those rules will be added domain by domain after DNS Data Entry consumes the authorization context.

The first write-enabled domain should be admin-only Pricing Persistence.

## 10. Long-term administration

Memberships and grants should eventually be managed through a trusted DNS admin interface backed by privileged server-side operations or narrowly-scoped administrative rules.

They must never be user-self-service permissions.


## 11. First DNS administrator bootstrap

The first administrator is bootstrapped from an **existing Firebase Authentication user**.

The repository provides:

```text
.github/workflows/bootstrap-admin.yml
scripts/bootstrap-admin.ts
```

The workflow is intentionally manual (`workflow_dispatch`) and asks for:

- existing Firebase Auth email;
- preferred UI language.

It never asks for or stores a password.

The bootstrap resolves the Firebase Auth user UID and creates/updates:

```text
users/{uid}
```

with:

```text
active: true
globalRoles: ["dns-admin"]
preferredLanguage: de | it | en
```

No organization membership or access grant is required for a global DNS administrator.

Subsequent partner users should normally use scoped memberships/access grants instead of `dns-admin`.
