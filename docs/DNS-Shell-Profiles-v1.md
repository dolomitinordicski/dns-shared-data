# DNS Shell Profiles v1.0

**Status:** normative Foundation contract  
**Profiles:** Operational · Portal · Workspace  
**Runtime:** `@dolomitinordicski/dns-shared-data/foundation` + `@dolomitinordicski/dns-shared-data/ui/shell`

## 1. Principle

DNS uses one Design System and one Foundation runtime.

Different applications may require different structural shells, but they must not create independent visual systems or duplicate shared header/navigation/footer/accessibility behavior.

Each Foundation-aligned application declares exactly one shell profile.

## 2. Operational

Use for:

- FAIR
- Analytics
- Data Entry
- Polls
- Faktura
- comparable internal operational tools

Characteristics:

- canonical DNS tool header;
- German/Italian switch;
- accessibility control;
- optional DNS_Core/system status;
- horizontal tabs/section navigation;
- dense operational content;
- shared footer;
- header may hide on scroll down while navigation remains available.

The application keeps its domain-specific workflows, calculations and persistence logic.

## 3. Portal

Use for Partner Portal and other authenticated account/organization-aware access layers.

Characteristics:

- canonical DNS header;
- account context;
- active organization context where relevant;
- language and accessibility controls;
- session action;
- application/service navigation;
- desktop app navigation may use a sidebar;
- mobile app navigation collapses to a drawer;
- shared footer;
- header remains stable rather than adopting the Operational hide-on-scroll pattern by default.

Portal does not own canonical user/organization identity data. It presents memberships and access grants from the shared platform domain.

Organization context and UI language are separate states.

## 4. Workspace

Use for authoring/creation applications such as Flyer Studio.

Characteristics:

- canonical DNS workspace header;
- Foundation-owned toolbar;
- tool-owned canvas;
- Foundation-framed inspector/context controls;
- optional mobile bottom-sheet/panel;
- footer optional;
- no Operational tab bar by default;
- full-width workspace geometry.

The governing rule is:

> Foundation governs the authoring environment, not the authored artifact.

The flyer/poster/content produced inside the canvas may use independent creative typography, colors, templates and composition rules.

## 5. Runtime declaration

Example:

```ts
const foundation = initDNSFoundation({
  shellProfile: 'operational',
});
```

Portal:

```ts
initDNSFoundation({
  shellProfile: 'portal',
});
```

Workspace:

```ts
initDNSFoundation({
  shellProfile: 'workspace',
});
```

If omitted, the profile is `operational` for backward compatibility with current DNS tools.

## 6. Capability defaults

### Operational
- Tool Chrome: enabled
- Print: enabled
- Footer: enabled
- Accessibility: enabled
- Motion/interaction/primitives/content patterns: enabled

### Portal
- Operational Tool Chrome: disabled by default
- Print: enabled
- Footer: enabled
- Accessibility: enabled
- Motion/interaction/primitives/content patterns: enabled

Portal app navigation will be implemented through the Portal shell/navigation contract, not by reusing operational tabs.

### Workspace
- Operational Tool Chrome: disabled by default
- Print runtime remains available for tool-owned printable artifacts where required
- Footer: not required by default
- Accessibility: enabled
- Motion/interaction/primitives/content patterns: enabled

Workspace-specific toolbar/inspector behavior is Foundation-owned; creative canvas behavior remains tool-owned.

## 7. Semantic regions

Consumers declare regions with Foundation data attributes.

Operational:
- `data-dns-tool-header`
- `data-dns-tool-nav` when used
- `data-dns-shell-main`
- `data-dns-tool-footer`

Portal:
- `data-dns-tool-header`
- `data-dns-app-nav`
- `data-dns-organization-context` when applicable
- `data-dns-shell-main`
- `data-dns-tool-footer`

Workspace:
- `data-dns-tool-header`
- `data-dns-workspace-toolbar`
- `data-dns-workspace-canvas`
- `data-dns-workspace-inspector`
- `data-dns-workspace-mobile-panel`

## 8. Geometry

All profiles consume the same breakpoints, typography, controls, colors and interaction rules.

Operational and Portal use the standard DNS content width up to 1440px.

Workspace may use full-width geometry because the editor canvas is itself the primary working surface.

The shell runtime exposes profile geometry through CSS variables and profile attributes rather than application-owned constants.

## 9. Responsive behavior

Operational:
- horizontal navigation;
- horizontal scroll on small screens;
- no hamburger substitution for standard tab sections.

Portal:
- app navigation desktop;
- drawer/mobile navigation on small screens.

Workspace:
- toolbar remains available;
- inspector may collapse;
- mobile inspector/actions may move to a bottom sheet/panel;
- canvas remains the primary surface.

## 10. Prohibited patterns

Foundation-aligned tools must not:
- create a fourth shell profile locally;
- fork DNS header geometry for one application;
- reuse Operational tab behavior for Portal simply because it already exists;
- give Workspace a separate visual identity;
- move domain/business logic into the shell runtime;
- constrain creative output to administrative UI typography/colors;
- hardcode shell breakpoints/geometry that already exist in Foundation.

## 11. Consumer migration

During consolidation:

- FAIR / Analytics / Data Entry / Polls / Faktura → `operational`
- Hub → `operational` unless later explicitly reclassified
- Partner Portal → `portal`
- Flyer Studio → `workspace`

Migration changes shell/runtime ownership only. Tool-specific engines remain untouched.
