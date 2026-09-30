# DNS Public Order Sharing & Print v1

**Date:** 1 October 2026  
**Scope:** supplier-facing order snapshots, print output, shared brand assets

## Public supplier links

External suppliers never receive access to `ticketOrders` or `ticketOrderLines`.

DNS Data Entry creates a read-only snapshot in:

```text
publicOrderShares/{unguessableShareId}
```

One independent share is used for:

- wristbands;
- weekly/season cards.

A snapshot contains only the data needed by the supplier:

- season;
- category;
- generated timestamp;
- order item labels;
- wristband colour legend where relevant;
- organizations;
- quantities;
- total quantity.

Public clients can fetch one exact active share document by ID. They cannot list or search the collection.

DNS administrators can create, update and revoke shares.

## Revocation / expiry

A share contains:

```text
active: true | false
expiresAt?: Firestore Timestamp
```

Setting `active=false` immediately blocks public reads.

## Print system

Print is governed by DNS Design System tokens.

Default v1.3 print profile:

```text
A4 landscape
10 mm margins
14 mm print logo height
compact table typography
DNS table borders/colors
interactive controls hidden
generated-at metadata visible
```

The print logo is always:

```text
brand/logo.png
```

The application header/web logo is:

```text
brand/logo-web.png
```

## Canonical asset directory

```text
brand/
├── logo-web.png
└── logo.png
```

Until both PNG files are uploaded, applications may retain their existing local web logo fallback. Print output must switch to the canonical `logo.png` as soon as it is available.
