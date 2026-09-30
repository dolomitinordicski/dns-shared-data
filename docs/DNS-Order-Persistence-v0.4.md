# DNS Order Persistence v0.4

**Scope:** persisted seasonal order catalogue, matrices and scoped Firestore writes  
**Target:** DNS_Core / DNS Data Entry  
**Date:** 1 October 2026

## 1. Persisted collections

```text
orderCatalogItems
orderFormConfigs
ticketOrders
ticketOrderLines
```

The 2026-27 workbook is imported once as operational draft evidence. A marker in
`orderSetupImports/2026-27` prevents later deploys from overwriting live edits.

## 2. Seasonal wristband colours

Wristband colours are explicitly seasonal catalogue metadata because DNS rotates
colours between seasons.

The 2026-27 visual legend includes the supplier references visible in the
provided reference image:

```text
14 yellow       803C
16 red          185C
33 grape        807C
15 light green  CMYK / reorder 34186062
13 blue         Process Blue C
20 black        Black
51 gold         872C
11 white        workbook item; not visible in the supplied colour image
```

`displayColorHex` is only an approximate UI swatch. It is not a print-production colour specification.

## 3. Workbook import semantics

The exact 2026-27 workbook values are imported with this distinction:

- explicit `0` -> persisted line with `quantity: 0`;
- blank source cell -> no `ticketOrderLine` document.

This preserves the operational difference between “zero ordered” and “not entered”.

Source controls:

```text
wristbands total:             55,700
weekly / season tickets:      24,415
```

## 4. Deterministic IDs

Order header:

```text
2026-27__<category>__<organizationId>
```

Order line:

```text
<orderId>__<catalogItemId>
```

This makes matrix upserts deterministic and idempotent.

## 5. Authorization

Access-grant document IDs are deterministic:

```text
<uid>__organization__<organizationId>
<uid>__reportingArea__<reportingAreaId>
<uid>__network__dolomiti-nordicski
```

A user may access an order when they are:

- `dns-admin`; or
- granted the relevant `ticketOrders.read` / `ticketOrders.write` permission
  at network, reporting-area or organization scope.

Catalogue/configuration writes remain admin-only.

## 6. Audit behavior

Order headers cannot be deleted by normal contributors. Matrix lines may be
deleted by a permitted contributor so a previously entered cell can be cleared.

Changing organization, season or category of an existing order is denied.
Changing organization/order/catalog identity of an existing line is denied.

## 7. Development mode

Frontend development mode never bypasses these rules. Without Firebase
Authentication it can render the fallback matrix but cannot read/write protected
order collections.
