# Firebase Master Dataset v0.1 — DNS_Core

**Project:** DNS_Core  
**Firebase project ID:** `dns-core`  
**Firestore database:** `(default)`  
**Canonical dataset:** v1.5  
**Status:** seed-ready  
**Date:** 30 September 2026

## Purpose

This is the first operational master-data layer for the DNS digital ecosystem.

The canonical definitions remain owned by:

```text
dolomitinordicski/dns-shared-data
```

Firestore is the runtime persistence layer consumed by DNS applications.

## Collections seeded in v0.1

```text
reportingAreas
destinations
organizations
seasons
```

Current document counts:

```text
reportingAreas     8
destinations      16
organizations     16
seasons            5
--------------------
total             45
```

`organizationRelationships` is intentionally deferred to the next schema step. The first seed establishes verified identities and geographic structure only.

## Firestore document IDs

Firestore document IDs are identical to canonical IDs.

Examples:

```text
reportingAreas/osttirol
destinations/toblach
organizations/tvb-osttirol
organizations/seiser-alm-marketing
organizations/servizi-ampezzo
seasons/2026-27
```

## Metadata added by the seed

Each seeded document receives:

```text
canonicalId
schemaVersion
canonicalDatasetVersion
source
createdAt
updatedAt
```

`createdAt` is written only when the document is first created.

`updatedAt` is refreshed on every canonical seed.

The seed uses Firestore merge writes. This is intentional: a canonical update must not erase future operational fields owned by applications.

## Security

DNS_Core starts deny-by-default.

The repository contains:

```text
firestore.rules
```

with no client reads or writes enabled.

Client access will only be opened later, collection by collection, after Authentication, Memberships and Access Grants are defined.

The Admin SDK seed bypasses client Firestore Security Rules by design and therefore must be run only with trusted administrator credentials.

## Credential rule

Never commit or upload a Firebase service-account private key to this repository.

The repository ignores common credential filenames through `.gitignore`.

Preferred local authentication is Google Application Default Credentials.

Example:

```bash
gcloud auth application-default login
gcloud config set project dns-core
```

Alternative: use a locally stored service-account JSON file and point `GOOGLE_APPLICATION_CREDENTIALS` to it. The JSON file must remain outside version control.

## Dry run

Install dependencies:

```bash
npm install
```

Then:

```bash
npm run seed:firebase
```

Dry run validates the canonical graph and prints the planned document count.

It performs no Firestore writes.

## Apply

After administrator authentication is configured:

```bash
npm run seed:firebase:apply
```

The script is hard-bound to:

```text
dns-core
```

and rejects an explicitly configured different project.

## Validation before write

The seed aborts if it finds:

- duplicate IDs;
- IDs that are not lowercase kebab-case;
- unknown Reporting Area references;
- unknown Destination references;
- unknown parent Destinations;
- a provisional organization;
- anything other than exactly one active season.

## Source-of-truth rule

Do not manually edit canonical identity fields in Firestore as the long-term workflow.

The intended direction is:

```text
dns-shared-data
      │
      │ reviewed canonical change
      ▼
seed / migration
      │
      ▼
DNS_Core Firestore
      │
      ▼
DNS applications
```

Operational application data will eventually live alongside the master layer, but ownership boundaries remain defined by DNS Foundation.

## Not included in v0.1

The following are deliberately not part of this seed:

- users;
- Firebase Authentication;
- memberships;
- accessGrants;
- organizationRelationships;
- Analytics measurements;
- FAIR calculations;
- Partner Portal data;
- Poll PII;
- ticket orders;
- billing preparation;
- XGLA4 data.

These are separate next steps.
