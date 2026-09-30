# DNS Seasonal Operational Dataset v0.2

**Scope:** season-specific pricing, ticket orders, ticket sales, KP/track reporting, provenance and corrections  
**Target runtime:** DNS_Core / Firestore  
**Status:** operational contract before write-enabled DNS Data Entry  
**Date:** 1 October 2026

## 1. What v0.2 changes

v0.2 extends the v0.1 seasonal model without changing its core principles.

New first-class concerns:

- ticket orders and order lines;
- provenance and method versioning;
- append-only correction/audit records;
- explicit traceability from sales back to ordered stock when available;
- ticket-order submission workflow.

Pricing, sales and KP remain season-specific and continue referencing canonical DNS master IDs.

## 2. Firestore collections

```text
pricingConfigs
ticketOrders
ticketOrderLines
ticketSales
kpMilestones
kpEntries
seasonalSubmissions
operationalRevisions
```

These are operational collections, not public master data. Client write access remains closed until Auth, memberships and access grants are implemented.

## 3. Ordered is not sold

A ticket order records stock/distribution and Billing Prep. It is not a performance fact.

Canonical flow:

```text
ticketOrder
    ↓
ticketOrderLines
    ↓
distributed / available stock
    ↓
ticketSales
    ↓
Analytics
```

Analytics may later derive:

- ordered quantity;
- sold quantity;
- sell-through rate;
- theoretical remaining stock;
- product mix by ordered stock;
- actual sales relative to available stock.

No report may treat an ordered quantity as a sold quantity.

## 4. Ticket orders

A `TicketOrder` is an order header scoped to:

```text
season
organization
reporting area
order date
status
```

Supported lifecycle:

```text
draft
submitted
confirmed
fulfilled
cancelled
```

Multiple orders/reorders per organization and season are valid. The model deliberately avoids one mutable "season total order".

## 5. Ticket order lines

Order quantities are stored as queryable `ticketOrderLines`, not as one opaque array in an order document.

Each line stores:

```text
ticketOrderId
seasonId
organizationId
reportingAreaId
productCode
quantity
optional channel / period
pricing snapshot
calculatedAmount
provenance
```

The pricing snapshot is frozen with the order line so a later tariff change does not rewrite historical Billing Prep.

XGLA4 remains the authoritative accounting system. DNS_Core prepares operational billing values only; official invoice identity/status can be referenced later but is not owned here.

## 6. Linking orders and sales

A sale may optionally reference:

```text
ticketOrderId
ticketOrderLineId
fulfillmentBatchId
```

This link is optional because historical/manual sales may not have reliable stock-level traceability.

The absence of an order link does not invalidate a historical sales record.

## 7. Provenance

Every important operational fact carries source/method metadata.

```text
sourceSystem
sourceRecordId?
importedAt?
methodVersion
dataStatus
```

Supported source systems:

```text
legacy-sheet
manual-data-entry
digital-ticketing
import
other
```

Supported data statuses:

```text
draft
submitted
verified
verified-with-notes
corrected
superseded
```

This allows historical workbook data and future digital ticketing to coexist without rewriting the past.

Example:

```text
WS 2025-26
sourceSystem: legacy-sheet
methodVersion: 1
dataStatus: verified-with-notes

WS 2026-27
sourceSystem: manual-data-entry
methodVersion: 1
dataStatus: verified

future season
sourceSystem: digital-ticketing
methodVersion: 2
dataStatus: verified
```

A method change is not the same thing as a correction.

## 8. Historical corrections

Verified history is not silently overwritten.

Corrections are stored in the append-only collection:

```text
operationalRevisions
```

A revision stores:

```text
entityType
entityId
fieldPath?
originalValue
correctedValue
correctionReason
correctedAt
correctedBy
correctionSource
supersedesRevisionId?
```

This makes it possible for Analytics to distinguish, later:

- as reported;
- current corrected view.

The default reporting policy can be decided in Analytics, but the underlying evidence remains available.

## 9. Pricing

The v0.1 price model remains unchanged in principle.

Precedence:

```text
organization override
    ↓
reporting-area override
    ↓
network default
```

Price and settlement value remain distinct:

```text
unitPrice
settlementUnitPrice
```

Optional `validFrom` and `validTo` remain necessary because presale dates are not uniform across all historical contributors.

## 10. Ticket sales

Ticket sales remain actual operational performance facts.

They store:

```text
seasonId
organizationId
reportingAreaId
destinationId?
productCode
salesChannel
salesPeriod?
quantity
pricing snapshot
calculatedAmount
amountOverride?
amountOverrideReason?
order traceability?
provenance
```

Historical anomalies found in the source workbook remain explicit migration cases and are not normalized silently.

## 11. KP / track reporting

KP keeps the v0.1 model:

- organization or destination scope;
- unique network km;
- potential operational km;
- milestone values;
- natural/artificial snow km;
- include/exclude from KPI;
- exclusion reason.

v0.2 adds required provenance to KP entries so workbook history and future direct collection remain distinguishable.

## 12. Submission workflow

Supported domains now include:

```text
ticketOrders
ticketSales
kp
```

Each organization/domain/season can move through:

```text
draft
submitted
verified
```

This workflow status is separate from provenance `dataStatus`: submission state describes the operational workflow, while data status describes the state of the underlying record.

## 13. What remains derived

The following remain derived and must not become independently entered totals:

- reporting-area totals;
- DNS totals;
- sold-vs-ordered ratios;
- theoretical remaining stock;
- revenue totals where quantity + frozen pricing are sufficient;
- annual comparisons;
- KP percentages;
- Analytics rankings;
- FAIR calculations.

## 14. Migration and rollout

Recommended sequence:

```text
1. freeze schema v0.2
2. implement Auth / memberships / access grants
3. enable admin-only pricing persistence
4. implement ticket orders / Billing Prep
5. implement ticket sales
6. implement KP
7. implement verification
8. import/reconcile historical data
9. connect Analytics to verified operational collections
10. connect FAIR to the appropriate verified outputs
```

The historical workbooks remain source evidence and must not be deleted.
