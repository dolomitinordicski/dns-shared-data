# DNS Faktura — Foundation Specification v0.1

**Status:** Foundation-defined  
**Owner:** DNS Commercial  
**Purpose:** internal calculation and preparation of billable amounts by organization and reporting area.

## 1. Scope

DNS Faktura answers one operational question:

> What should DNS bill to each organization for the selected season, and which source data supports each amount?

The tool aggregates approved or operational source data, lets DNS review the resulting billing lines, and produces an internal billing summary.

It is **not** an accounting or invoicing system.

## 2. Explicit boundary

DNS Faktura does not:

- create official/fiscal invoices;
- assign official invoice numbers;
- track payments, reminders or outstanding receivables;
- post bookkeeping entries;
- integrate with accounting software.

Official invoicing and accounting remain outside the DNS platform.

## 3. Billing sources

### 3.1 FAIR / Mitgliedsbeitrag

Source owner: **DNS FAIR**.

The billing preparation consumes the approved/final FAIR contribution for the organization/area and stores only a source reference plus the prepared billing line. It must not duplicate or recalculate the FAIR engine.

### 3.2 IDM Premiumpartner

Source owner: **DNS Commercial / annual configuration**.

Season-specific amounts are assigned to the participating organizations. The source must remain distinguishable from FAIR and orders.

### 3.3 Orders

Source owner: **DNS Orders / Data Entry**.

Initial relevant order categories:

- wristbands;
- pocketfolders;
- season tickets;
- weekly tickets.

Billing uses confirmed order quantities and the applicable commercial amount. The original order remains the source of truth.

### 3.4 Seasonal extras

Source owner: **DNS Commercial**.

A controlled category for season-specific billable items that are not yet a permanent DNS domain. The first planned 2026/27 use case is **Jackets 2026**.

A seasonal extra must always have a clear label, amount and organization assignment; it must not become a generic unstructured accounting bucket.

## 4. Core entities

Faktura reuses canonical DNS entities:

- `seasonId`
- `organizationId`
- `reportingAreaId`

Names and logos are resolved from `dns-shared-data`; Faktura must not maintain local organization or logo copies.

## 5. Billing preparation model

A billing line contains:

- source type;
- source reference;
- organization;
- reporting area when applicable;
- description;
- quantity;
- unit amount;
- calculated amount;
- include/exclude flag;
- optional internal note.

A billing run groups the lines for one organization and season.

Initial statuses:

- `draft`
- `ready`

`ready` means **ready for Alberto/DNS to invoice externally**. It does not mean that an official invoice has been issued.

## 6. First application views

### Overview

Season selector plus totals:

- total amount to prepare;
- organizations with billable lines;
- organizations complete;
- organizations still in draft;
- totals by source type.

### Organizations

One row/card per canonical organization with:

- canonical logo;
- organization name;
- reporting area;
- FAIR amount;
- IDM Premium amount;
- Orders amount;
- Seasonal extras;
- total;
- preparation status.

### Organization detail

Editable review view containing every source-backed billing line.

Automatic lines remain traceable to their source. Manual adjustments must be explicit and auditable rather than silently overwriting imported values.

### Source control

A diagnostic view showing whether each source is available and current:

- FAIR
- IDM Premium configuration
- Orders
- Seasonal extras

### Print / internal export

A clean DNS-branded internal summary for use while creating the official invoice externally.

No fiscal invoice layout, invoice number or payment status.

## 7. Calculation rule

For each included line:

`amount = quantity × unitAmount`

For lump-sum lines such as FAIR or IDM Premium:

`quantity = 1`

Organization total:

`totalAmount = sum(included line amounts)`

Source systems own their calculations. Faktura aggregates and prepares; it does not alter FAIR logic or order history.

## 8. Data ownership

| Data | Owner | Faktura role |
| --- | --- | --- |
| Canonical organization / area | DNS Shared Data | consume |
| FAIR contribution | FAIR | consume |
| Order quantities | DNS Orders | consume |
| Pricing / commercial amount | owning operational source | consume |
| IDM Premium assignment | DNS Commercial | own / configure |
| Seasonal extras | DNS Commercial | own / configure |
| Billing preparation lines | DNS Faktura | own |
| Official invoice / bookkeeping / payment | Outside DNS | out of scope |

## 9. Initial persistence target

Foundation collection names:

- `billingRuns`
- `billingLines`
- `billingAdjustments`

The application repository will define the Firestore implementation and security rules before these collections are promoted from Foundation-defined to implemented.

## 10. Non-negotiable architecture rules

1. One canonical organization ID everywhere.
2. Shared organization/area logos only.
3. FAIR calculations are never reproduced in Faktura.
4. Confirmed orders remain immutable source records; Faktura references them.
5. Manual corrections are explicit adjustments with a reason.
6. No accounting-software integration in v0.
7. No official invoice or payment lifecycle in DNS Faktura.
