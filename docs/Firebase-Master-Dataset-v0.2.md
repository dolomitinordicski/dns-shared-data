# Firebase Master Dataset v0.2 — DNS_Core

**Project:** DNS_Core  
**Firebase project ID:** `dns-core`  
**Firestore database:** `(default)`  
**Canonical dataset:** v1.6  
**Canonical schema:** 2  
**Date:** 30 September 2026

## What changes in v0.2

v0.2 adds explicit organization relationships and introduces the first public read layer for canonical master data.

The canonical source of truth remains:

```text
dolomitinordicski/dns-shared-data
```

Firestore remains the operational runtime copy used by DNS applications.

## Collections

```text
reportingAreas
destinations
organizations
organizationRelationships
seasons
```

Expected document counts:

```text
reportingAreas               8
destinations                16
organizations               16
organizationRelationships   16
seasons                      5
------------------------------
total                        61
```

## Organization relationships

Each relationship explicitly states:

```text
organizationId
relationshipType
scopeType
scopeId
active
```

Examples:

```text
tv-toblach-fair-contributor-drei-zinnen
  organizationId: tv-toblach
  relationshipType: fair-contributor
  scopeType: reportingArea
  scopeId: drei-zinnen
```

```text
tvb-osttirol-dns-member-dolomiti-nordicski
  organizationId: tvb-osttirol
  relationshipType: dns-member
  scopeType: network
  scopeId: dolomiti-nordicski
```

Only already confirmed relationships are generated. The dataset does not infer additional DNS membership, commercial, marketing or access relationships.

## Public read governance

The following canonical collections contain no personal data and are already based on public master information:

```text
reportingAreas
destinations
organizations
organizationRelationships
seasons
```

Firestore Security Rules therefore permit:

```text
READ  → public
WRITE → denied to all client applications
```

All other current and future collections remain deny-by-default until their authentication and authorization model is explicitly defined.

Administrative seed operations use Firebase Admin credentials and are not governed by client Firestore rules.

## Why public read

This allows a public DNS application such as Analytics to consume the same canonical IDs and labels without introducing Firebase Authentication merely to read non-sensitive reference data.

It does **not** open operational, personal, commercial, billing or poll data.

## Validation

Before any seed write, the script checks:

- unique canonical IDs;
- lowercase kebab-case IDs;
- valid Reporting Area references;
- valid Destination references;
- valid Organization references;
- valid relationship types;
- valid relationship scopes;
- consistency between organization Reporting Areas and relationship scopes;
- only verified organizations;
- exactly one active season.

## Apply v0.2

After pulling the latest `main` branch in Cloud Shell:

```bash
git pull
npm install
npm run seed:firebase
npm run seed:firebase:apply
```

The first seed command is a dry-run only.

## Deploy Firestore rules

After the data seed succeeds:

```bash
npm run deploy:firebase:rules
```

This deploys only:

```text
firestore.rules
```

to:

```text
dns-core
```

It does not deploy Hosting, Functions or any DNS application.

## Result after v0.2

DNS_Core becomes a safe public master-data API for non-sensitive canonical DNS reference data while remaining closed to client-side writes.

This prepares the next phase: connecting DNS Analytics to canonical master data without migrating Analytics measurements yet.
