# DNS Seasonal Operational Dataset v0.1

**Scope:** season-specific pricing, ticket sales and KP/track reporting  
**Target runtime:** DNS_Core / Firestore  
**Status:** architecture baseline before DNS Data Entry implementation  
**Date:** 30 September 2026

## 1. Why this layer exists

The current seasonal workflow is split across complex Excel/Google Sheets files. Those files currently mix:

- raw user input;
- season pricing;
- formulas;
- reporting-area aggregation;
- DNS-level aggregation;
- Analytics outputs;
- manual notes and exceptional accounting logic.

v0.1 separates those concerns.

The source of truth for identities remains the canonical master dataset in
`dns-shared-data`. Seasonal operational data references canonical IDs and does
not redefine organizations, destinations or reporting areas.

## 2. Proposed Firestore collections

```text
pricingConfigs
ticketSales
kpMilestones
kpEntries
seasonalSubmissions
```

These collections are **not public master data**. Client access remains closed
until Authentication, memberships and write rules for DNS Data Entry are
implemented.

## 3. Seasonal pricing

Pricing is versioned by season. A new season receives a new set of price
records; historical prices are never overwritten.

A pricing record is resolved by:

```text
season
+ product
+ scope
+ sales channel
+ optional sales period
+ optional validity dates
```

Scope precedence:

```text
organization override
    ↓
reporting-area override
    ↓
network default
```

This is required because the source workbooks demonstrate that not all prices
are network-wide.

### Network-level products

Current 2025-26 workbooks show common DNS prices for products such as WK DNS and
SK DNS. The coming 2026-27 season is expected to change WK DNS to, for example:

```text
WK DNS standard        65 EUR
WK DNS on-track        75 EUR
```

These are season-specific values, not permanent constants.

### Area/organization-level prices

DAY and WK AREA clearly vary by reporting area and/or sales channel. The schema
therefore permits reporting-area and organization overrides.

SK AREA is uniform in the reviewed 2025-26 workbook (125 EUR regular / 115 EUR
presale), but is deliberately **not hard-coded as globally fixed**. It remains
configurable per season/scope so future deviations do not require a schema
change.

## 4. Price is not always the accounting value

The source workbook contains complimentary/region-funded tickets that have:

- customer price = 0;
- non-zero accounting value used in reporting.

Therefore every pricing record can contain:

```text
unitPrice
settlementUnitPrice
```

Revenue is calculated from the settlement value when present.

This also allows exceptional zero-value tickets such as press passes or special
instructor allocations without abusing another product's price.

## 5. Sales periods and dates

The workbook does not use one perfectly uniform presale cut-off across all
partners.

Examples in 2025-26 include variants equivalent to:

```text
presale through 06.12 → regular from 07.12
presale through 07.12 → regular from 08.12
```

The new model therefore stores optional `validFrom` / `validTo` dates on
pricing records. The UI must not assume one global hard-coded cut-off.

## 6. Ticket sales: raw facts first

DNS Data Entry should primarily collect quantities.

A sale entry stores:

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
```

The pricing snapshot is stored with the entry so historical Analytics does not
change when a later season receives new prices.

### Exceptional amount override

The source files contain comments/behaviour suggesting exceptional accounting
or commission treatment. Rather than allowing hidden spreadsheet edits, v0.1
supports an explicit:

```text
amountOverride
amountOverrideReason
```

This should be rare and visible in the UI/audit trail.

## 7. Multi-organization reporting areas

The workbooks show reporting areas that aggregate multiple operational
contributors.

Examples:

- Antholzertal + Biathlon;
- 3 Zinnen Dolomites with multiple local tourism organizations;
- Ahrntal + Sand in Taufers;
- Seiser Alm + Val Gardena.

The new workflow should therefore save the **lowest available organization-level
input first** and derive reporting-area totals from canonical relationships.

Reporting-area totals should not be independently re-entered.

## 8. Ticket-workbook anomalies found during audit

The following are preserved as migration/audit cases. They must not be silently
"corrected" during import.

### Cortina

The 2025-26 workbook's regional SK DNS quantity formula includes the
complimentary SK AREA quantity. The control formula also counts that
complimentary quantity twice. This may represent a special business rule or a
spreadsheet error; the new system must require an explicit classification
rather than reproduce the formula blindly.

### Seiser Alm / Val Gardena

The displayed regional total is higher than the control total by exactly the
Langlauflehrer quantity/value (8 tickets / 840 EUR). Other regions treat that
category differently in their controls. The new system keeps instructor passes
as an explicit product and derives totals consistently.

### Ahrntal / Sand in Taufers

The Sand in Taufers detail block contains 2 Langlauflehrer tickets with zero
value, while the regional aggregate shows zero tickets. This must be reviewed
during historical import and can be represented explicitly as zero-value /
complimentary instructor tickets if confirmed.

### Complimentary AREA settlement

Most reviewed areas value complimentary SK AREA tickets using a non-zero
settlement amount. Cortina uses a different value from the common SK AREA
price. This is why `settlementUnitPrice` is a first-class field.

### Press tickets

WK DNS press tickets exist as a distinct zero-price case in the workbook.
The new model represents this through product + sales channel rather than a
special spreadsheet row.

## 9. KP / track reporting

KP is modelled as raw milestone data, not as pre-calculated Analytics output.

Per entity and season:

```text
reference kilometres
milestone date
natural-snow kilometres
artificial-snow kilometres
include/exclude from KPI
notes
```

Milestones are season configuration, not hard-coded dates.

## 10. KP anomalies found during audit

### Stale analysed-data labels

The raw 2025-26 sheet uses milestones:

```text
23.12.2025
06.01.2026
20.01.2026
```

but the analysed-data sheet still contains labels referring to 2024/2025.
The new model stores milestone dates once and derives labels from them.

### Unique km vs potential operational km

The source uses more than one kilometre concept. In particular, the analysed
regional table uses a potential operational kilometre denominator that can
differ from the raw "Gesamtkilometer (einzelne)" value.

A visible example is Comelico:

```text
raw unique km:               42
analysed potential km:       64
```

Therefore v0.1 stores both concepts separately:

```text
uniqueNetworkKm
potentialOperationalKm
```

They must not be collapsed into one field.

### Values above 100%

Some artificial/opened kilometre calculations can exceed the unique-km
reference in the historical workbook. The Data Entry UI should warn when this
happens but **must not reject the value automatically**, because the source also
contains notes about loops/double counting and operational definitions that
need business review.

### Entity exceptions

KP includes scopes that do not map one-to-one to the sales reporting structure,
for example Obertilliach as a separate destination and Biathlon Antholz as a
separate organization. `kpEntries` can therefore target either canonical
organizations or canonical destinations.

An entity can also remain stored but be excluded from a KPI through:

```text
includeInKp
exclusionReason
```

## 11. Workflow status

Each organization/domain/season can have a submission status:

```text
draft
submitted
verified
```

This replaces the current ambiguity of "is this sheet finished?" and prepares a
proper DNS Data Entry workflow.

## 12. What remains derived

The following should **not** be user-entered source data:

- reporting-area totals;
- DNS totals;
- revenue totals where price + quantity are sufficient;
- online/traditional summary totals;
- annual comparisons;
- KP percentages;
- Analytics rankings;
- FAIR calculations.

They are derived from verified raw entries and canonical relationships.

## 13. Migration principle

The 2025-26 Excel/Google Sheets files remain frozen historical source evidence.

Migration sequence:

```text
1. define operational schema
2. build DNS Data Entry
3. import 2025-26 raw values
4. reconcile anomalies explicitly
5. verify derived outputs against current Analytics
6. switch 2026-27 collection to DNS Data Entry
7. retire operational Google Sheets
```

No historical source workbook should be deleted as part of the migration.
