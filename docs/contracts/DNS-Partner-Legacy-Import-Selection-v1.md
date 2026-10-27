# DNS Legacy Self Evaluation — selective import specification v1

Source: DNS Self Evaluation Test (Antworten), tab Formularantworten 1.
Status: proposed mapping, no personal records transferred.

## Field whitelist (1-based column index)

| Columns | Action | Destination |
|---|---|---|
| 1 | preserve source timestamp | immutable source metadata |
| 4-5, 7-10 | review, confirm with approved partner record | name, address, business email, website, area, tourism association |
| 6 | review | business phone |
| 11-12 | review | trail access and distance |
| 16-17 | review | skiroom and equipment |
| 18 | reference only | skiroom evidence; do not copy file until security and retention review |
| 19 | review | laundry and drying |
| 21 | review | guest information services |
| 23-25 | review | ticket availability, products and sales methods |
| 27-30 | review | packages and rental/ski-school cooperation |
| 31 | review | cross-country website page |
| 32-35 | history only / reference for screenshots | historic DNS logo, text and trail links; replace with verified widget state |

## Explicit exclusions

- Respondent email column 2: **do not automatically authorize an account**. Identity uses the separately approved DNS contact register; column 7 is only an unverified business-contact suggestion.
- Score column 3: outdated model, never an active accreditation.
- Columns 36-37 and 42: physical DNS plaque and evidence, retired from new onboarding.
- Columns 38-45: interest surveys, comments, ambiguous technical/duplicated data; do not copy to active record.
- Columns 46-95: guest behavior estimates, segmentation, nationality, sentiment and economic questions; not imported as hotel profile data.
- Columns 13-15, 20, 22, 26: avoid copying by default; either unpopulated, ambiguous or nonessential free-form. Retain only in original archival source.
- Do not import any individual guests' data, actual name/password credentials, uploaded attachments or source links to public widgets.

## Controls

Import **staging candidates** with original source row ID and timestamp, field values typed as self-declared and marked for partner confirmation. Deduplicate by reviewed canonical establishment ID; do not guess from a shared email, name or website. Preserve provenance and unchanged original source. No official quality status inferred. Invalid/missing values remain unknown. Partner may confirm an entire section, edit fields or flag not applicable; record a new review timestamp and user. For new partner properties without a historical response, use blank progressive onboarding. Authorized beds and seasonal opening are new mandatory/unknown fields not present in the form.

The certified widget is the guided next onboarding task after confirmation. Historical logo presence is not equivalent to an installed certified widget. Widget mandate for accreditation remains subject to working group decision.

No production import or FAIR changes in this specification.
