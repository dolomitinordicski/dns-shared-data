# DNS Organization Audit v1.3

**Date:** 30 September 2026  
**Scope:** identity, canonical naming, Reporting Area / Destination mapping, aliases and verification status.  
**Excluded from this audit:** logos, fiscal master data, invoicing data and XGLA4 records.

## Status meaning

- **verified** — the organization identity is supported by an official institutional or organization-controlled source.
- **provisional** — the current DNS label is known, but the exact organization that should represent the DNS relationship still requires confirmation.

## Audit result

| Canonical ID | Canonical organization | Reporting Area | Destination(s) | Status | Notes |
|---|---|---|---|---|---|
| `dolomiti-nordicski` | Dolomiti NordicSki | — | — | verified | DNS network operator |
| `tvb-osttirol` | Tourismusverband Osttirol | Osttirol | Osttirol | verified | Official Osttirol tourism association |
| `tv-sexten` | Tourismusverein Sexten | 3 Zinnen Dolomites | Sexten | verified | Listed by official 3 Zinnen contact page |
| `tv-innichen` | Tourismusverein Innichen | 3 Zinnen Dolomites | Innichen | verified | Listed by official 3 Zinnen contact page |
| `tv-toblach` | Tourismusverein Toblach | 3 Zinnen Dolomites | Toblach | verified | Listed by official 3 Zinnen contact page |
| `tv-niederdorf` | Tourismusverein Niederdorf | 3 Zinnen Dolomites | Niederdorf | verified | Listed by official 3 Zinnen contact page |
| `tv-prags` | Tourismusverein Prags | 3 Zinnen Dolomites | Prags | verified | Listed by official 3 Zinnen contact page |
| `biathlon-antholz` | Biathlon Weltcup Komitee / Comitato Coppa del Mondo di Biathlon | Antholzertal | Antholzertal | verified | Official Biathlon Antholz ticketing/footer identity; FISI also identifies Biathlon Committee Antholz |
| `antholzertal` | Tourismusgenossenschaft Antholzertal | Antholzertal | Antholzertal | verified | Current official Antholzertal legal/privacy information |
| `ahrntal` | Tourismusverein Ahrntal | Ahrntal | Ahrntal | verified | Official Ahrntal material identifies Tourismusverein Ahrntal / Associazione Turistica Valle Aurina |
| `sand-in-taufers` | Tourismusverein Sand in Taufers | Ahrntal | Sand in Taufers | verified | Official provincial tourism list / municipality references |
| `seiser-alm` | Seiser Alm | Seiser Alm Dolomites Val Gardena | Seiser Alm | **provisional** | Two relevant identities exist: Seiser Alm Marketing Gen. (regional marketing organization) and Associazione turistica Alpe di Siusi / Tourismusverein Seiser Alm. Confirm which entity is the DNS FAIR contributor/member |
| `val-gardena` | DOLOMITES Val Gardena | Seiser Alm Dolomites Val Gardena | Val Gardena | verified | Official umbrella organization; legal entity published as Dolomites Val Gardena S.c.a.r.l. |
| `cortina-d-ampezzo` | Cortina d'Ampezzo | Cortina d'Ampezzo | Cortina d'Ampezzo | **provisional** | Cortina Marketing is documented as a functional unit of Servizi Ampezzo. Confirm which entity formally represents the DNS relationship |
| `val-comelico` | Consorzio Turistico Val Comelico Dolomiti | Val Comelico | Val Comelico | verified | Official consortium for tourism promotion and development of Val Comelico |
| `gsiesertal-welsberg-taisten` | Tourismusgenossenschaft Gsiesertal-Welsberg-Taisten | Gsiesertal / Welsberg / Taisten | Gsiesertal; Welsberg-Taisten | verified | Official contact/imprint identity |

## Sources used

### Osttirol
- https://www.osttirol.com/
- https://www.osttirol.com/it/contatti-1

### 3 Zinnen Dolomites
- https://www.dreizinnen.com/de/kontakt
- https://www.dreizinnen.com/de/privacy

### Antholzertal
- https://www.antholzertal.com/de/impressum
- https://www.antholzertal.com/de/datenschutz

### Biathlon Antholz
- https://biathlon-antholz.anyticket.it/
- https://www.fisi.org/comitati/biathlon-committee-antholz/

### Ahrntal / Sand in Taufers
- https://www.ahrntal.com/de/impressum.html
- https://www.ahrntal.com/
- https://turismo.provincia.bz.it/it/elenco-organizzazioni-turistiche

### Seiser Alm
- https://www.seiseralm.it/
- https://running.seiseralm.it/de/impressum.html
- https://turismo.provincia.bz.it/it/elenco-organizzazioni-turistiche

### Val Gardena
- https://www.valgardena.it/it/note-legali/
- https://www.valgardena.it/en/gstc/team-dolomites-val-gardena/

### Cortina d'Ampezzo
- https://cortina.dolomiti.org/
- https://cortina.dolomiti.org/wp-content/uploads/2024/06/guida-A5_Cortina-MArketing_ITA_2024-3.pdf

### Val Comelico
- https://consorziovalcomelico.it/
- https://consorziovalcomelico.it/chi-siamo/

### Gsiesertal / Welsberg / Taisten
- https://www.gsieser-tal.com/de/kontakt.html

## Remaining decisions before Firebase Master Dataset v0.1

Only two current organization identities require a DNS-side confirmation:

1. **Seiser Alm** — confirm whether the DNS counterpart is Seiser Alm Marketing Gen., Tourismusverein/Associazione turistica Alpe di Siusi, or another entity.
2. **Cortina d'Ampezzo** — confirm whether the DNS counterpart is Cortina Marketing as operational unit, Servizi Ampezzo as legal entity, or another organization.

All other current FAIR contributor identities can be treated as verified master entities for the first Firebase seed.

