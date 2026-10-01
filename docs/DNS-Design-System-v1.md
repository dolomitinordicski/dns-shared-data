# DNS Design System v1

**Brand colors reference:** Dolomiti NordicSki Corporate Design  
**Interaction reference:** dolomitinordicski.com  
**Data-tool reference:** DNS Analytics  
**Target:** all DNS digital tools  
**Runtime source:** DNS_Core / Firestore  
**Current semantic version:** 1.10.1

## Principle

The DNS Design System combines three authoritative references:

1. **DNS Partner Portal** for brand colors and core visual identity.
2. **dolomitinordicski.com** for the lighter public-facing interaction language: navigation, buttons, hover/focus behavior and restrained motion.
3. **DNS Analytics** for compact, data-heavy application patterns: cards, metrics, tables and chart presentation.

The design system centralizes **tokens and UI conventions**, not entire application stylesheets or React components. Every tool keeps its own layouts and domain-specific UI while consuming the same visual foundation.

## Core brand palette

The Dolomiti NordicSki Corporate Design defines three named corporate blues:

- **Frosted Ice Blue** — `#0D4D5E` — primary structural color for headers, strong hierarchy, major surfaces and primary actions.
- **Nordic Sky Blue** — `#417483` — secondary interaction color for navigation, labels, focus, supporting text and UI hierarchy.
- **Deep Glacier Blue** — `#AAD0D1` — semantic accent for shared, connected and contextual elements, micro-accents and secondary relationships.

Supporting UI neutrals include `#F4F8F9` as the application canvas, white surfaces, dark text and gray utility tones. These neutrals support the three corporate blues and do not replace them.

Individual applications must not invent alternate names or meanings for the three corporate blues.

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

## Motion & interaction v1.6

Motion is a shared DNS behavior, not a per-application decoration.

The canonical runtime values live in `DNS_Core / designSystem/current`, while executable JavaScript remains versioned source code in `dns-shared-data` or in the consuming application bundle. Firestore must never contain executable animation or interaction code.

### Motion tokens

The shared contract defines:

- `fastMs: 200` for immediate interaction feedback;
- `standardMs: 300` for normal control transitions;
- `revealMs: 600` for restrained entrance/reveal motion;
- `ease` as the current common easing;
- `hoverScale: 1.05` and `touchScale: 0.96` for interactive feedback;
- reveal from `8 px` below with opacity `0 → 1`;
- stagger intervals of `40 ms` (compact) and `70 ms` (standard).

Reveal motion is intended for meaningful section/card entrance only. It is not a general instruction to animate every element.

### Interaction tokens

The shared contract also defines:

- a visible 2 px DNS-mid focus ring with 2 px offset;
- hover transforms only on elements that are actually interactive and only on hover-capable pointer devices;
- press/touch feedback using the shared touch scale;
- consistent control transition properties and timing;
- link underline behavior on hover or `:focus-visible`;
- tab motion limited to color and active-border transitions rather than decorative sliding indicators;
- passive cards remain static.

### Reduced motion

`prefers-reduced-motion: reduce` is part of the shared contract.

When active:

- transition/reveal duration becomes zero;
- transform-based reveal is disabled;
- automatic reveal animation is disabled;
- information and state changes must remain fully understandable without motion.

### Runtime boundary

The design system deliberately separates **configuration** from **code**:

```text
dns-shared-data/src/design-system.ts
        ↓ seed
DNS_Core / designSystem/current
        ↓ read
DNS applications
        ↓
local/shared versioned JS helpers
```

Remote Firestore documents provide tokens only. Applications must never download and execute JavaScript stored in Firestore.

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
- interaction and focus behavior;
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

The document keeps a semantic `version` field, currently `1.10.1`.

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


## Shared responsive behavior

Responsive behavior is part of the design system, not an application-by-application invention.

### Tab navigation

The canonical tool navigation follows DNS Analytics:

- horizontal text tabs;
- transparent tab background;
- no pills and no boxed buttons;
- active tab indicated by a 3 px bottom border;
- uppercase compact labels;
- sticky navigation where appropriate.

Desktop navigation may wrap naturally onto multiple rows when the tool contains many sections; horizontal scrolling is reserved for tablet and mobile. Mobile does not replace tool tabs with a hamburger and does not stack tabs vertically.

### Layout

- Desktop: normal multi-column data layouts.
- Tablet: reduce columns while preserving hierarchy.
- Mobile: one-column cards and metrics.
- Tables never collapse semantic columns; tablet/mobile use horizontal scrolling.
- Header becomes progressively more compact; mobile hides secondary status/subtitle content before hiding core identity.
- Footer switches from horizontal to stacked on mobile.

## Context selectors

Selectors that change the operational context of a screen — such as region, reporting area or season — use **Deep Glacier Blue** as the persistent selected-state background. Text remains Frosted Ice Blue, focus remains Nordic Sky Blue, and ordinary form fields stay neutral. This pattern is reserved for context selection, not general input styling.


## Sticky navigation & scroll progress

DNS tool navigation may use a lightly translucent sticky surface rather than a fully opaque bar. The current shared tokens are:

- navigation surface opacity: `0.94`;
- backdrop blur: `6 px`;
- scroll-progress height: `3 px`;
- scroll-progress color: **Deep Glacier Blue** (`#AAD0D1`);
- progress track: transparent.

The progress indicator sits at the top edge of the sticky navigation, visually occupying the separation between header and navigation. It communicates reading/navigation position only; it is not decorative motion. The value is derived from the current document scroll position and must remain understandable with reduced-motion preferences.

Desktop navigation wraps when necessary. Tablet and mobile retain horizontal scrolling.


## Runtime first-paint rule

DNS applications must render from the canonical local Design System fallback immediately. Reading `DNS_Core / designSystem/current` is a runtime enhancement and must not delay first paint, navigation or motion initialization.

When the remote document exposes the same semantic version already shipped locally, applications should avoid reapplying an identical token set. Motion/interaction runtimes should be restarted only when their relevant token groups actually differ.

This prevents visible second-pass layout/reveal behavior while preserving the remote configuration layer.
