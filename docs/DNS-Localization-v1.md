# DNS Localization & Bilingualism Contract v1.0

**Status:** normative Foundation contract  
**Operational languages:** German + Italian  
**Primary/default language:** German  
**Fallback language:** German

## 1. Principle

Bilingualism is a Foundation capability, not a per-tool feature.

All Foundation-aligned DNS applications must provide a consistent German/Italian interface. German is the authoritative default and fallback language. Italian is the secondary operational language.

The current operational contract is deliberately limited to `de` and `it`. The architecture may be extended later, but applications must not independently add a third UI language.

## 2. UI language

```text
uiLanguage = de | it
default = de
fallback = de
```

Language resolution order:

```text
explicit current-session choice
→ authenticated account preference
→ stored browser preference
→ de
```

Browser/OS language detection is intentionally not used as an automatic default.

## 3. Persistence

The shared browser storage key is:

```text
dns-ui-language-v1
```

Unauthenticated applications may persist the preference locally.

For authenticated applications such as Partner Portal:
- the account preference may be persisted in the authorized user profile;
- local browser preference remains useful before login;
- an explicit session choice has priority during the current session;
- organization language must not silently override the user's UI language.

Foundation defines resolution behavior. Applications remain responsible for authorized account persistence until a shared identity runtime owns it.

## 4. UI language vs content language

These are distinct states.

```text
uiLanguage = de | it
contentLanguage = de | it | bilingual
```

Examples:
- Flyer Studio UI in German can author an Italian flyer.
- Portal UI in Italian can download a German document.
- A bilingual document may contain both DE and IT while the application UI remains German.

Foundation controls authoring-environment language. Tool/domain logic controls the language of authored/exported content where relevant.

## 5. Translation ownership

### Foundation owns

Shared terms and messages such as:
- save / cancel / confirm / close;
- print / download / upload;
- loading / empty / error / offline;
- saving / saved / syncing;
- unauthorized / forbidden / not found;
- generic statuses;
- generic form/accessibility language;
- shared header, navigation, dialogs and system states.

Canonical shared messages are exported from `src/localization.ts`.

### Tool owns

A tool may define its own domain vocabulary:
- FAIR-specific concepts;
- Analytics metric names and explanations;
- Poll-specific workflow text;
- Faktura/billing terminology;
- Flyer-specific editor terminology.

Tool dictionaries must still follow the same `de` / `it` / fallback contract. Shared Foundation wording must not be copied into tool dictionaries merely for convenience.

## 6. Missing translations

Runtime rule:

```text
requested IT missing → use DE
requested DE missing → use DE
missing in both → development/CI defect
```

A missing Italian translation must never render an empty label or crash a tool.

Development/CI should report missing keys even when runtime fallback keeps the application usable.

## 7. Canonical data

Canonical IDs are language-independent and must never change with UI language.

Display values use localized fields, for example:

```ts
localizedName.de
localizedName.it
```

If Italian display text is unavailable, use the German display value according to the same fallback rule.

Do not store translated display strings as relational keys.

## 8. Formatting

Formatting must use Foundation helpers or equivalent shared runtime behavior, not per-tool string formatting.

Canonical locales:

```text
de → de-IT
it → it-IT
```

Foundation owns formatting behavior for:
- numbers;
- currency;
- percentages;
- dates/times where no domain-specific format is mandated.

Raw values remain language-neutral.

Tool-specific regulatory/document formats may define stricter formatting, but must document the exception.

## 9. Print, export, email and calendar output

Language applies beyond the screen.

A printable/exported artifact must declare which language drives:
- labels;
- headings;
- explanatory copy;
- generated metadata.

Default behavior: use active `uiLanguage`.

Where a workflow exposes `contentLanguage`, that explicit content language wins for the generated artifact.

This applies to:
- print sheets;
- PDF/report exports;
- order confirmations;
- generated email copy;
- ICS/calendar descriptions;
- Partner Portal documents.

## 10. Accessibility

All human-facing accessibility text must follow the active UI language:
- aria-label;
- button names;
- validation messages;
- dialog titles;
- keyboard/help text;
- loading/error state copy;
- tooltips where used.

An interface is not considered translated if visible labels change language while accessibility labels remain in another language.

## 11. URLs and deep links

The Foundation does not require language to be encoded in every URL.

Where shareable/public content requires deterministic language, applications may use an explicit language parameter/path. Such a parameter must accept only supported Foundation languages and must fall back to German.

Language parameters must not alter canonical entity IDs.

## 12. Partner Portal rule

Partner Portal must support:
- account-level UI language preference;
- organization switching independent from UI language;
- access-grant and account states translated through Foundation;
- German fallback even when account preference is missing/invalid.

Organization language is metadata/content context, not automatic user-interface language.

## 13. Flyer Studio rule

Flyer Studio must keep these states independent:

```text
editor UI language
creative content language
template language availability
```

Foundation governs editor UI language only. Flyer/template content may be German, Italian or bilingual according to the creative workflow.

## 14. Consumer rule

Foundation-aligned applications must not:
- invent another language-storage key;
- default automatically to browser language;
- implement Italian → empty instead of Italian → German fallback;
- duplicate shared Foundation messages locally;
- format numbers/dates independently without a documented reason;
- couple organization identity to UI language;
- couple Flyer editor language to flyer content language.

## 15. F1 integration target

The future `initDNSFoundation()` runtime will own:
- language resolution;
- browser persistence;
- `document.documentElement.lang`;
- shared Foundation translations;
- language-change notification/subscription;
- shared formatting helpers;
- integration hook for authenticated account preference.

F0.5 defines the contract before F1 implements that runtime.
