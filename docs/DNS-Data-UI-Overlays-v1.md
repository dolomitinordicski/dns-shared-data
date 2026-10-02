# DNS Overlay, Forms, Upload & Data UI Contract v1.0

**Status:** normative Foundation contract

## 1. Scope

Foundation owns shared UI semantics and accessibility for:
- overlays;
- common form states;
- upload/drop-zone presentation;
- shared data controls;
- application states.

Tool repositories retain business logic, persistence, validation rules, queries and workflow state transitions.

## 2. Overlay taxonomy

Canonical overlay types:

```text
modal
confirm
drawer
popover
dropdown
menu
tooltip
toast
blocking
```

Blocking overlays must trap focus and restore focus on close. Escape closes ordinary modal/confirm/drawer/popover/dropdown/menu/tooltip overlays. A truly blocking overlay does not Escape-close by default.

## 3. Forms

Canonical form states:

```text
default
required
valid
error
readonly
disabled
dirty
saving
saved
```

The tool decides when a value is valid/dirty/saving/saved. Foundation owns the visible and accessible treatment.

## 4. Upload

Canonical upload states:

```text
idle
dragging
uploading
success
error
disabled
```

Foundation owns the drop-zone/status presentation. File validation, storage target, persistence, virus/security policy and business handling remain tool-owned.

## 5. Data UI

Canonical shared actions:

```text
search
filter
sort
paginate
columns
select
bulk
export
```

Foundation owns controls, selection presentation and layout. Query semantics, datasets and export contents remain tool-owned.

Bulk actions require explicit visible selection.

## 6. Application states

Canonical states:

```text
loading
empty
error
offline
unauthorized
forbidden
not-found
saving
saved
syncing
stale
```

State must be explicit and accessible. Motion alone must never communicate state.

## 7. Accessibility

Overlay behavior requires:
- focus trap where blocking;
- Escape behavior according to overlay contract;
- focus return;
- semantic role/ARIA;
- keyboard-accessible actions.

Forms require labels, error/help associations and disabled/readonly semantics.

## 8. Foundation runtime

`initDNSFoundation()` initializes F5 Data UI styling by default.

Package entries:

```text
@dolomitinordicski/dns-shared-data/data-ui
@dolomitinordicski/dns-shared-data/ui/data-ui
@dolomitinordicski/dns-shared-data/ui/overlay
```

## 9. Boundaries

F5 does not:
- create Firebase writes;
- define business validation;
- define upload destinations;
- define Analytics queries;
- define FAIR calculations;
- define Polls PII behavior;
- define Faktura billing logic.

## 10. Consumer migration

During consolidation, tools should replace duplicated modal/form/table-toolbar/upload/state CSS and lifecycle behavior with the Foundation contracts while preserving domain logic.
