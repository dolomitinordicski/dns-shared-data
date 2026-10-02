# DNS Foundation Core Runtime v1.0

**Status:** canonical shared runtime  
**Entry point:** `@dolomitinordicski/dns-shared-data/foundation`  
**Browser module:** `/dist/foundation.js` on DNS Shared Data Pages

## 1. Purpose

`initDNSFoundation()` is the single orchestration entry point for Foundation-aligned DNS applications.

It replaces application-owned setup code that separately initializes or reimplements:

- Design System CSS variables;
- UI primitives;
- content patterns;
- interaction/focus/press behavior;
- reveal/motion behavior;
- tool chrome/navigation behavior;
- print runtime;
- shared footer behavior;
- accessibility runtime;
- DE/IT language state.

Applications may retain tool-specific UI and business engines. They must not maintain a second Foundation runtime.

## 2. Default behavior

A normal operational application calls:

```ts
import { initDNSFoundation } from '@dolomitinordicski/dns-shared-data/foundation';

const foundation = initDNSFoundation();
```

The runtime then uses the canonical package Design System and enables the shared capabilities by default.

Expected markup contracts include:
- `data-dns-tool-header`
- `data-dns-tool-nav`
- optional `data-section` tabs
- `data-dns-tool-footer`
- optional `data-dns-accessibility-mount`

The runtime is safe to initialize before late-rendered header/navigation/accessibility targets because shared chrome/accessibility initialization supports deferred mounting.

## 3. Single source rule

The default and authoritative source is the versioned package:

```text
DNS_DESIGN_SYSTEM
→ initDNSFoundation()
→ CSS variables + shared runtimes
```

Consumer applications must not:
- copy `DNS_DESIGN_SYSTEM` into local fallback files;
- fetch `designSystem/current` and independently merge it with local tokens;
- maintain local `applyVariables()` implementations;
- initialize shared runtimes one-by-one when the Core Runtime can own them;
- add compatibility aliases as permanent Foundation behavior.

The optional `designSystem` parameter exists for controlled testing/composition and marks runtime source as `provided`; it is not a license for each tool to maintain its own Design System.

## 4. Language ownership

The Core Runtime implements the F0.5 localization contract:
- explicit language → account preference → stored preference → DE;
- storage key `dns-ui-language-v1`;
- German default/fallback;
- Italian secondary;
- `document.documentElement.lang` kept in sync;
- `dns:languagechange` event;
- subscription API for framework consumers;
- accessibility language synchronized from the same runtime.

Example:

```ts
const foundation = initDNSFoundation();
foundation.setLanguage('it');

const unsubscribe = foundation.subscribeLanguage((language) => {
  // update tool-owned domain copy
});
```

Tool-specific dictionaries remain application-owned but must follow the same DE/IT/fallback contract.

## 5. Runtime handle

`initDNSFoundation()` returns one handle per Document:

- `getLanguage()`
- `setLanguage()`
- `subscribeLanguage()`
- `refresh()`
- `printNow()`
- `disconnect()`

Repeated initialization on the same Document returns the existing handle instead of installing duplicate event listeners/runtimes.

## 6. Capability switches

Capabilities can be disabled only for legitimate application profiles or migration needs:

```ts
initDNSFoundation({
  chrome: false,
  print: false,
  footer: false,
  accessibility: false,
});
```

The default is enabled.

A consumer must document why a standard Foundation capability is disabled.

## 7. Accessibility

By default the runtime looks for:

```html
<div data-dns-accessibility-mount></div>
```

The mount may appear after initialization. The Core Runtime will attach the canonical accessibility runtime when it becomes available.

Accessibility translations now consume the canonical Foundation localization catalog rather than a separate DE/IT dictionary.

## 8. Design variables

`applyDNSDesignVariables()` is the only canonical Design System → CSS variables bridge.

It owns shared variables for:
- corporate colors;
- typography;
- shape/spacing/shadows;
- motion;
- header/footer;
- controls/cards;
- metrics/tables;
- context selectors;
- navigation;
- responsive spacing;
- reading text.

Tool-specific CSS may consume these variables. It must not redefine their semantic value.

## 9. Print

The Core Runtime initializes the shared print runtime and exposes:

```ts
foundation.printNow();
```

Tool-specific print content remains allowed. Page geometry and shared print styling remain Foundation-owned.

Future F3 print-profile work extends the print contract without changing the Core Runtime entry point.

## 10. Static consumers

Static applications such as Hub do not require a second runtime.

DNS Shared Data Pages publishes the built package, therefore static consumers may import:

```js
import { initDNSFoundation } from
  'https://dolomitinordicski.github.io/dns-shared-data/dist/foundation.js';
```

All imported dependencies resolve from the same deployed `dist/` tree.

## 11. Consumer migration rule

F1 introduces the runtime but does not silently rewrite application repositories.

During the consolidation pass each consumer will:
1. pin the same Foundation release;
2. replace local Foundation setup with `initDNSFoundation()`;
3. delete local Design System fallback/variable bridges;
4. remove duplicate runtime initialization;
5. remove compatibility bridges after markup becomes Foundation-native;
6. verify tool-specific engine/calculations remain unchanged.

## 12. Explicit non-goals

F1 does not:
- change FAIR calculations;
- change Analytics calculations/data;
- change Polls workflows/PII domain;
- change Faktura billing logic;
- change Data Entry persistence;
- implement Portal/Flyer business behavior;
- add new Firebase writes.

It standardizes the shared runtime only.

## 13. Shell profiles

F2 extends the Core Runtime with `shellProfile`:

```ts
initDNSFoundation({ shellProfile: 'operational' });
initDNSFoundation({ shellProfile: 'portal' });
initDNSFoundation({ shellProfile: 'workspace' });
```

Operational remains the default. The profile controls structural defaults such as Operational Tool Chrome and required footer behavior; it does not change tool-specific business engines.

See `docs/DNS-Shell-Profiles-v1.md`.

## 14. Print profiles

F3 extends the Core Runtime with `printProfile` and per-artifact profile selection:

```ts
const foundation = initDNSFoundation({
  printProfile: 'operational-table',
});

foundation.printNow('report');
foundation.printNow('document');
```

See `docs/DNS-Print-Profiles-v1.md`.

## 15. Semantic motion

F4 adds shared semantic motion to the Core Runtime:

```ts
foundation.playMotion(element, 'enter');
foundation.playMotion(element, 'modal');
foundation.playMotion(element, 'drawer', { direction: 'reverse' });
```

The runtime applies Foundation-owned timing/easing/transform values and honors both system and DNS Accessibility reduced-motion preferences.

See `docs/DNS-Motion-Interaction-Semantics-v1.md`.

## 16. Data UI & overlays

F5 is initialized by the Core Runtime by default. Consumers may use the canonical overlay/data UI contracts directly while retaining tool-owned business logic.

See `docs/DNS-Data-UI-Overlays-v1.md`.

## 17. Identity & access UI

F6 is initialized by the Core Runtime by default. It provides shared presentation for account, organization, membership and access context without implementing authentication or authorization.

See `docs/DNS-Identity-Access-UI-v1.md`.
