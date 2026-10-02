# DNS Motion & Interaction Semantics v1.0

**Status:** normative Foundation contract  
**Scope:** shared motion intent, interaction feedback and reduced-motion behavior

## 1. Principle

DNS applications declare **what is happening**, not arbitrary animation values.

Foundation owns:
- semantic motion presets;
- duration/easing/transform choices;
- reduced-motion behavior;
- shared hover/press/focus feedback;
- restrained interaction language.

Applications own:
- when a real state transition happens;
- business/state logic;
- whether a semantic event is appropriate at all.

Motion is functional. It supports orientation, feedback, continuity and state understanding. It is not decoration.

## 2. Semantic motion events

Canonical events:

```text
enter
exit
expand
collapse
modal
drawer
toast
tab
contextChange
loading
```

Consumers must select one of these meanings instead of hardcoding durations/transforms.

## 3. Event intent

### enter
New content becomes available in the current task.

### exit
Transient content leaves. Exit remains shorter than enter and must not delay authoritative state completion.

### expand / collapse
Progressive disclosure in the same context: details, accordions, secondary panels.

### modal
Blocking dialog enters/leaves. Focus management and Escape behavior are separate accessibility requirements.

### drawer
A side/mobile panel preserves spatial origin.

### toast
Transient non-blocking feedback.

### tab
View changes at the same navigation level. DNS does not slide whole pages between tabs.

### contextChange
Region, season, organization or other active-context change without implying route navigation.

### loading
Subtle activity feedback. Prefer opacity/state feedback over continuous spatial motion.

## 4. Interaction semantic roles

Canonical roles:

```text
action
selection
toggle
navigation
destructive
```

Markup may use:

```html
<button data-dns-interaction="action">...</button>
<button data-dns-interaction="selection" aria-selected="true">...</button>
<button data-dns-interaction="toggle" aria-pressed="true">...</button>
<a data-dns-interaction="navigation" aria-current="page">...</a>
<button data-dns-interaction="destructive">...</button>
```

These roles reuse shared hover/press/focus behavior.

Semantic meaning must still be represented with native/ARIA state where applicable:
- `aria-selected`
- `aria-pressed`
- `aria-expanded`
- `aria-current`

Motion alone never communicates state.

## 5. Runtime use

Via Foundation:

```ts
foundation.playMotion(element, 'modal');
foundation.playMotion(element, 'drawer');
foundation.playMotion(element, 'contextChange');
```

Reverse a reversible preset when closing:

```ts
foundation.playMotion(element, 'modal', { direction: 'reverse' });
```

Direct shared runtime use is also available through:

```text
@dolomitinordicski/dns-shared-data/ui/semantic-motion
```

## 6. Reduced motion

Two signals are authoritative:

1. system `prefers-reduced-motion: reduce`;
2. DNS Accessibility setting `dns-a11y-reduce-motion`.

When either is active:
- transforms/animation delays are removed;
- the element moves directly to its final semantic state;
- interaction remains functional;
- no information may depend on animation.

If the DNS Accessibility setting is enabled while an animation is running, Foundation finishes the active semantic motion and resolves the final state.

## 7. Timing rules

Durations/easings are Foundation-owned.

Consumers must not:
- override preset duration locally;
- override easing locally;
- invent different transforms for the same semantic event;
- add bounce/spring effects;
- introduce stagger solely for decoration.

The existing reveal runtime remains available for restrained content reveal, but should not be used to choreograph whole administrative pages.

## 8. Navigation

Tab transitions remain intentionally restrained:
- indicator/color feedback;
- optional subtle opacity transition;
- no full-view horizontal page slide.

Portal drawer movement uses the `drawer` semantic.

Workspace inspector/mobile panel movement also uses the `drawer` or `expand/collapse` semantics according to structure.

## 9. Loading

Loading motion must never create the impression that the application is progressing when it is stalled.

Applications remain responsible for:
- loading state truth;
- timeout/error handling;
- stale/offline state;
- accessible loading text.

Foundation only defines the visual feedback.

## 10. Modal / drawer / toast boundary

F4 defines their **motion semantics only**.

F5 defines the actual overlay contracts:
- focus trap;
- Escape;
- focus return;
- z-index;
- responsive behavior;
- blocking/non-blocking semantics.

This separation prevents animation behavior from owning accessibility or application state.

## 11. Prohibited patterns

Foundation-aligned applications must not:
- use decorative looping movement in operational tools;
- animate passive cards on hover;
- use motion to replace visible state labels;
- use color/motion alone for selection;
- delay save/delete/navigation because an exit animation is still playing;
- create tool-specific modal/drawer/toast animation systems;
- ignore DNS Accessibility reduce-motion preference.

## 12. Consumer migration

During consolidation:
1. retain business state logic;
2. replace local motion constants with semantic events;
3. replace duplicated press/hover feedback with `data-dns-interaction`;
4. remove redundant local CSS transitions where Foundation owns them;
5. verify keyboard/focus/state semantics independently from motion;
6. test both system reduced-motion and DNS Accessibility reduced-motion.
