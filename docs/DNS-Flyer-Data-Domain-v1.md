# DNS Flyer Studio — DNS Core Data Domain v1

**Status:** governed DNS_Core domain  
**Project:** `dns-core`  
**Application:** DNS Flyer Studio

## Collections

### `flyerDocuments`
Mutable working documents.

Required governance metadata:
- `id`
- `schema = dns.flyer-document`
- `version = 1`
- `scopeType`: network | reportingArea | organization
- `scopeId`
- `seasonId`
- `status`: draft | ready | archived
- `ownerUserId`
- `document`: FlyerDocument v1 snapshot
- `updatedBy`
- `updatedAt`

Draft ownership is user-scoped. DNS grants may extend access by network, reporting area or organization.

### `flyerPublications`
Immutable publication snapshots.

A published flyer never changes in place. Corrections create a new publication.

### `flyerTemplates`
Reusable DNS / area / organization templates. Built-in system templates remain versioned in application code.

### `flyerAssets`
Asset metadata only.

Binary images, logos, icons and documents must live in Cloud Storage. Firestore stores identifiers, paths, type and governance metadata only.

## Permissions

- `flyer.read`
- `flyer.write`
- `flyer.publish`
- `flyer.templates.manage`
- `flyer.assets.manage`

DNS admins retain full governance through the existing `dns-admin` role.

## Block data rule

Visual Block components never import Firebase.

Data flow:

```text
DNS Core / Storage
→ application providers
→ FlyerDocument block bindings
→ Block resolver
→ Block Engine
→ visual renderer
```

## Persistence rule

LocalStorage is migration/cache only. It is not equivalent to live DNS Core persistence.

## Publication rule

Saving a working document does not publish it.

```text
flyerDocuments (draft/ready)
        ↓ explicit publish
flyerPublications (immutable snapshot)
```

## Assets

F6 establishes Firestore asset metadata and provider contracts. Storage upload/rules must be enabled before custom binary assets are promoted from local cache.
