# DNS Seasonal Operational Dataset v0.3

**Scope:** seasonal order catalogue, order forms, ticket orders, ticket sales, KP and provenance  
**Target runtime:** DNS_Core / Firestore  
**Status:** order-model refinement based on the 2026-27 operational order workbook  
**Date:** 1 October 2026

## 1. Why v0.3 is needed

The 2026-27 operational order workbook contains two distinct order matrices:

1. **Armbänder / Braccialetti**
2. **Wochen- und Saisonkarten / Settimanali-Stagionali**

The first matrix orders physical wristband variants. The second orders ticket products.

A wristband colour is not a ticket product. Therefore v0.3 introduces a season-specific **order catalogue** instead of forcing every order line into `TicketProductCode`.

## 2. New collections

```text
orderCatalogItems
orderFormConfigs
```

Existing order collections remain:

```text
ticketOrders
ticketOrderLines
```

## 3. Order catalogue

Every season can define its own orderable items.

```text
OrderCatalogItem
- id
- seasonId
- category: ticket | wristband
- code
- label
- displayOrder
- productCode?          // ticket items only
- physicalVariantCode? // wristbands / supplier reference
- active
```

Examples from the 2026-27 workbook:

### Wristbands

```text
14 yellow
16 red
33 grape
15 light green
13 blue
20 black
51 gold
11 white
```

### Weekly / season tickets

```text
Wochenkarte Lokal / Settimanale locale
Wochenkarte DNS / Settimanale DNS
Saisonkarte Lokal / Stagionale locale
Saisonkarte DNS / Stagionale DNS
Freikarten / Biglietti in omaggio
Langlauflehrer-Karten / Tessere per maestri sci fondo
PRESS
```

The catalogue is seasonal because physical variants and order requirements can change between seasons.

## 4. Order form configuration

The workbook shows that the two matrices do not have exactly the same participating rows.

`OrderFormConfig` therefore defines, per season/category:

```text
catalogItemIds[]
organizationIds[]
```

This allows:

- wristband ordering for partner organizations;
- ticket ordering for partner organizations plus DNS itself where required;
- future changes without schema changes.

## 5. Order line change

`TicketOrderLine` now references:

```text
catalogItemId
```

instead of requiring only a ticket product.

For ticket catalogue items:

```text
productCode?
pricing?
calculatedAmount?
```

may be present.

For wristbands, these fields can remain absent.

This preserves the principle:

```text
physical order material != ticket sales product
```

## 6. Matrix UX

The operational UI should mirror the successful structure of the workbook:

```text
organizations on rows
catalogue items on columns
quantity in cells
row total
column totals
```

A DNS administrator can see the full matrix.

A scoped partner user should eventually see only the organization rows covered by their memberships/access grants.

## 7. Source workbook mapping

The 2026-27 source workbook currently contains:

- wristband total: **55,700**
- weekly/season-ticket total: **24,415**

These values are migration/source evidence. Import must preserve blanks vs explicit zero where the workbook distinguishes them.

The source workbook is not deleted or overwritten by this model.

## 8. Billing Prep

Ticket catalogue lines may use pricing snapshots and calculated Billing Prep values.

Wristband order lines are operational physical-order quantities and do not require ticket pricing.

XGLA4 remains the accounting authority.

## 9. Firestore collections after v0.3

```text
pricingConfigs
orderCatalogItems
orderFormConfigs
ticketOrders
ticketOrderLines
ticketSales
kpMilestones
kpEntries
seasonalSubmissions
operationalRevisions
```

Operational browser writes remain closed until the corresponding authorization rules are implemented.
