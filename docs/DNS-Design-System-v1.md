# DNS Design System v1

**Visual reference:** DNS Analytics  
**Target:** all DNS digital tools  
**Runtime source:** DNS_Core / Firestore  
**Status:** v1 baseline

## Principle

DNS Analytics is the visual reference for the shared DNS look & feel.

The design system centralizes **tokens and UI conventions**, not entire application
stylesheets or React components. Every tool keeps its own layouts and domain-specific
UI while consuming the same visual foundation.

## Core identity

- Deep: `#0D4D5E`
- Mid: `#417483`
- Light: `#AAD0D1`
- Background: `#F4F8F9`
- Surface: `#FFFFFF`
- Primary font: **Be Vietnam Pro**
- Secondary/data font: **Roboto**
- Card radius: **10 px**
- Card shadow: `0 1px 4px rgba(13,77,94,.07)`
- Header: deep DNS color, white title, light subtitle
- Footer: deep DNS color, compact uppercase secondary text

## Shared patterns

The shared system includes:

- typography;
- colors;
- spacing;
- card and metric styling;
- controls;
- tables;
- header/footer conventions;
- status colors;
- chart palette;
- bilingual DE/IT convention.

## Application specificity

The following remain local to each tool:

- page structure and navigation;
- domain-specific forms;
- charts and chart semantics beyond the shared palette;
- print layouts;
- specialized widgets;
- accessibility behaviors that depend on the application.

## Versioning

Firestore structure:

```text
designSystem/v1
designSystem/current
```

Applications should:

1. ship with a local fallback copy;
2. load `designSystem/current`;
3. apply remote tokens only when the payload is valid;
4. continue rendering with the local fallback when Firestore is unavailable.

A future `v2` can be published without deleting or mutating `v1`.

## Governance

Browser clients may read the design system but never write it.

Publishing a new design-system version must happen through the controlled
`dns-shared-data` repository and its administrative deployment process.
