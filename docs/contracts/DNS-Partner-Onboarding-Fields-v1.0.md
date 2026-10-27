# DNS Partner Onboarding Field Catalog v1.0
**Status:** Proposed fields; NOT a live form or an approved quality standard.
**Owners:** DNS Partner Management + DNS Partner Hub. Canonical IDs belong to DNS Core.

## Field policy
- `activation`: small set of required partner-confirmed values; verified values prefilled.
- `profile`: progressive optional completion.
- `assessment`: criteria-version-based self-evaluation.
- `future`: schema-ready but hidden and not collected.
- Email authentication is handled by Firebase Auth, not this catalog. Never store passwords in a partner profile.
- Unknown is null, not zero; preserve declared versus verified values, source, validFrom, updatedAt, reviewer and correction provenance.
- Fields below have stable IDs; changing wording does not change their IDs.

| Field ID | Group | Activation policy | Value type / notes |
| --- | --- | --- | --- |
| establishment.displayName | identity | required, prefill | text; changes to verified name become review requests |
| establishment.type | identity | required, prefill | hotel/residence/apartment/camping/other; extensible |
| establishment.legalName | identity | profile | text; authorized organization |
| establishment.businessIdentifier | identity | profile | registration/tax identifier with country and access restrictions |
| establishment.website | identity | profile | HTTPS URL |
| establishment.address | location | required, prefill | street, locality, postal code, country |
| establishment.reportingAreaId | location | verified-prefill | canonical reportingArea; correction request only |
| establishment.geo | location | profile | validated latitude/longitude |
| establishment.contactEmail | contacts | auth verified | verified preauthorized email, backend-only account claim |
| establishment.operationalEmail | contacts | profile | separate notifications address, verify change |
| establishment.phone | contacts | profile | normalized string |
| establishment.preferredLanguage | contacts | required | de/it/en |
| establishment.authorizedBeds | capacity | required or explicit unknown | nonnegative integer; date-effective |
| establishment.availableBeds | capacity | future | nonnegative integer, separate from authorized beds |
| establishment.roomCount | capacity | optional at activation | nonnegative integer or null |
| establishment.unitCount | capacity | optional at activation | nonnegative integer or null |
| establishment.openingMode | capacity | required | year-round/seasonal/unknown |
| establishment.openingWindows | capacity | profile | date intervals by season |
| establishment.exceptionalClosures | capacity | profile | date intervals, source |
| establishment.distanceToTrail | trails | profile | meters and measurement method, verified if used for criterion |
| establishment.trailAccessMode | trails | profile | walk/shuttle/public transport/car/other |
| establishment.referenceTrailIds | trails | future | canonical trail identifiers when available |
| establishment.skiroom | quality | assessment | criteria-version-dependent answers |
| establishment.waxing | quality | assessment | yes/no/equivalent/unknown |
| establishment.drying | quality | assessment | yes/no/equivalent/unknown |
| establishment.laundry | quality | assessment | yes/no/equivalent/unknown |
| establishment.sportBreakfast | quality | assessment | yes/no/equivalent/unknown |
| establishment.informationService | quality | assessment | yes/no/equivalent/unknown |
| establishment.ticketService | services | profile | offers/on request/not offered/unknown |
| establishment.rentalPartners | services | future | partner relationship IDs |
| establishment.schoolPartners | services | future | partner relationship IDs |
| establishment.mobilityService | services | profile | optional transportation services |
| establishment.crossCountryPackages | services | profile | yes/no/unknown; offer records separate |
| establishment.widgetIds | digital | managed automatically | linked public/certified widget configurations |
| establishment.widgetInstallation | digital | managed automatically | last verified/status, not proof of quality accreditation |
| establishment.evidenceIds | certification | assessment | private evidence refs, retention rules |
| establishment.accreditationIds | certification | managed by DNS | governed approval/revision |
| establishment.notificationPreferences | communication | profile | service channels vs separately consented marketing |
| establishment.benefitEntitlements | benefits | future | governed benefit records |
| establishment.trainingParticipation | benefits | future | structured event participation |
| establishment.occupancy | intelligence | future INACTIVE | denominator/methodology/date/source mandatory when enabled |
| establishment.guestNights | intelligence | future INACTIVE | aggregate only, no guest identity |
| establishment.crossCountryGuestShare | intelligence | future INACTIVE | derived or measured, explicitly qualified |

## Minimum activation form
After successful preauthorized-email verification:
1. Display name and location for **confirmation** (do not edit canonical IDs).
2. Type, authorized beds, optional rooms/units, opening mode, preferred language.
3. Terms/privacy-notice acknowledgement, with stored notice version and timestamp; marketing opt-in separate.
4. Submit: authenticated backend records self-declared values as pending where needed, and stores revision/audit events; account activation and accreditation are independent.
5. UI offers save/resume, multi-language labels, accessibility and explicit unknown values where data genuinely unavailable.

## Important invariants
- No personally identifying **guest** fields in this catalog, analytics, vouchers or public widgets.
- A partner's legal/representative contact is personal data: access control, purpose and retention still apply.
- Partner can propose corrections to verified business details; cannot unilaterally take ownership of an existing organization or change canonical area.
- All future inactive fields must be modeled in contracts without collecting data early.
- Registration of a new business and first activation of an existing member are separate workflows.
- No metric publication or FAIR integration in this release.
