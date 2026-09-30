# DNS Design System v1

**Brand colors reference:** DNS Partner Portal  
**Interaction reference:** dolomitinordicski.com  
**Data-tool reference:** DNS Analytics  
**Target:** all DNS digital tools  
**Runtime source:** DNS_Core / Firestore  
**Current semantic version:** 1.1.0

## Principle

The DNS Design System combines three authoritative references:

1. **DNS Partner Portal** for brand colors and core visual identity.
2. **dolomitinordicski.com** for the lighter public-facing interaction language: navigation, buttons, hover/focus behavior and restrained motion.
3. **DNS Analytics** for compact, data-heavy application patterns: cards, metrics, tables and chart presentation.

The design system centralizes **tokens and UI conventions**, not entire application stylesheets or React components. Every tool keeps its own layouts and domain-specific UI while consuming the same visual foundation.

## Core brand palette

The Partner Portal defines the DNS brand colors:

- Primary / Deep: `#0D4D5E`
- Secondary / Light: `#AAD0D1`
- Third / Mid: `#417483`
- Primary dark: `#08343F`
- Secondary dark: `#7BBABC`
- White: `#FFFFFF`
- Dark text: `#313131`
- Gray: `#DDDDDD`

These are brand tokens. Individual applications must not invent alternate primary DNS colors.

## Typography

- Primary: **Be Vietnam Pro**
- Secondary/data: **Roboto**
- Tool interfaces use compact sizes derived from Analytics.
- Marketing/public surfaces may use larger display sizes while retaining the same families.

## Interaction language

From the DNS web ecosystem we retain:

- lightweight controls;
- clear hover/focus feedback;
- approximately 300 ms standard transitions;
- restrained scale/underline effects;
- rounded controls rather than decorative AI-style pills everywhere;
- strong use of the DNS primary color for calls to action;
- secondary color for hover/accent states.

Tool UIs should remain calmer and denser than public marketing pages.

## Data-tool patterns

Analytics remains the reference for:

- 10 px card radius;
- subtle card shadow;
- compact metric cards;
- strong data hierarchy;
- restrained borders;
- compact tables;
- DNS chart palette;
- deep header and footer.

## Shared patterns

The shared system includes:

- typography;
- colors;
- spacing;
- motion;
- card and metric styling;
- controls;
- navigation behavior;
- tables;
- header/footer conventions;
- status colors;
- chart palette;
- bilingual DE/IT convention.

## Application specificity

The following remain local to each tool:

- page structure and navigation architecture;
- domain-specific forms;
- chart semantics beyond the shared palette;
- print layouts;
- specialized widgets;
- accessibility behaviors that depend on the application;
- tool-specific information density.

## Versioning

Firestore structure:

```text
designSystem/v1
designSystem/current
```

The document keeps a semantic `version` field, currently `1.1.0`.

Applications should:

1. ship with a local fallback copy;
2. load `designSystem/current`;
3. apply remote tokens only when the payload is valid;
4. continue rendering with the local fallback when Firestore is unavailable.

A future major visual revision can be published as `v2` without deleting or mutating `v1`.

## Governance

Browser clients may read the design system but never write it.

Publishing a new design-system version must happen through the controlled
`dns-shared-data` repository and its administrative deployment process.
