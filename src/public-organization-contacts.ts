/** Public contacts transcribed from DNS official /de/kontakte page (2026-10-30).
 * Informational records ONLY: no accounts, memberships or permissions are created.
 * Mapping decisions confirmed by DNS project management (2026-10-30):
 * - Cortina identity organization is existing 'servizi-ampezzo' (SEAM).
 * - Sci Club Cortina is the ticket/flyer operator, never the identity organization.
 * - Cortina IAT is a public information point; not an identity organization.
 * - Val Gardena is the organization; St. Christina is a local contact, not a new identity.
 * - Antholz canonical name remains Tourismusgenossenschaft Antholzertal.
 * Physical public contacts do not imply user authorization or account grants.
 */
export const DNS_PUBLIC_ORGANIZATION_CONTACTS = [
  {
    "id": "antholz",
    "name": "Tourismusverein Antholzertal",
    "address": {
      "street": "Niederrasner Straße 35 F",
      "postalCode": "39030",
      "city": "Rasen-Antholz",
      "country": "IT"
    },
    "phone": "+39 0474 496269",
    "email": "info@antholzertal.com",
    "website": "https://www.antholzertal.com",
    "organizationId": "antholzertal",
    "associationStatus": "existing-canonical-organization",
    "pec": "tourismusvereinantholzertal@pec.bz.it",
    "vatNumber": "01287710212",
    "canonicalOrganizationName": "Tourismusgenossenschaft Antholzertal"
  },
  {
    "id": "biathlon",
    "name": "Biathlon Weltcup Komitee / Südtirol Arena Alto Adige",
    "address": {
      "street": "Obertaler Straße 33",
      "postalCode": "39030",
      "city": "Rasen-Antholz",
      "country": "IT"
    },
    "phone": "0474/492390",
    "email": "info@biathlon-antholz.it",
    "website": "https://www.biathlon-antholz.it",
    "organizationId": "biathlon-antholz",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "osttirol",
    "name": "Tourismusverband Osttirol – Ferienregion Hochpustertal",
    "address": {
      "street": "Gemeindehaus 86",
      "postalCode": "9920",
      "city": "Sillian",
      "country": "AT"
    },
    "phone": "+43 50 212 300",
    "email": "hochpustertal@osttirol.com",
    "website": "https://www.hochpustertal.com",
    "organizationId": "tvb-osttirol",
    "associationStatus": "candidate-existing-id",
    "fax": "+43 50 212 300 2"
  },
  {
    "id": "cortina-tickets",
    "name": "SCI CLUB CORTINA (Tickets)",
    "address": {
      "street": "Piazzetta San Francesco, 5",
      "postalCode": "32043",
      "city": "Cortina d’Ampezzo",
      "country": "IT"
    },
    "phone": "0436 4740",
    "email": "sccortina1903@gmail.com",
    "website": null,
    "organizationId": null,
    "associationStatus": "flyer-operator-only",
    "whatsapp": "328 596 8469",
    "role": "ticket-operator",
    "flyerOperatorForOrganizationId": "servizi-ampezzo"
  },
  {
    "id": "cortina-iat",
    "name": "Cortina d'Ampezzo – Dolomiti / Ufficio Turistico Cortina – IAT",
    "address": {
      "street": "",
      "postalCode": "",
      "city": "Cortina d’Ampezzo",
      "country": "IT"
    },
    "phone": "+39 0436 869086",
    "email": "infopoint@cortinamarketing.it",
    "website": "https://www.dolomiti.org/en/cortina",
    "organizationId": null,
    "associationStatus": "public-information-point-not-identity"
  },
  {
    "id": "comelico",
    "name": "Consorzio Turistico Val Comelico Dolomiti",
    "address": {
      "street": "Largo Calvi, 4",
      "postalCode": "32040",
      "city": "Padola (BL)",
      "country": "IT"
    },
    "phone": "+39 0435 67021",
    "email": "dolomiti@valcomelico.it",
    "website": "https://www.dolomitivalcomelico.it",
    "organizationId": "val-comelico",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "ahrntal",
    "name": "Tourismusverein Ahrntal",
    "address": {
      "street": "Ahrner Str. 22",
      "postalCode": "39030",
      "city": "Luttach/Ahrntal",
      "country": "IT"
    },
    "phone": "+39 0474 671136",
    "email": "info@ahrntal.com",
    "website": "https://www.ahrntal.com",
    "organizationId": "ahrntal",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "sand",
    "name": "Tourismusverein Sand in Taufers",
    "address": {
      "street": "Josef-Jungmann-Str. 8",
      "postalCode": "39032",
      "city": "Sand in Taufers",
      "country": "IT"
    },
    "phone": "+39 0474 678076",
    "email": "info@taufers.com",
    "website": "https://www.taufers.com",
    "organizationId": "sand-in-taufers",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "seiser",
    "name": "Seiser Alm Marketing",
    "address": {
      "street": "Dorfstr. 15",
      "postalCode": "39050",
      "city": "Völs am Schlern (BZ)",
      "country": "IT"
    },
    "phone": "+39 0471 709600",
    "email": "info@seiseralm.it",
    "website": "https://www.seiseralm.it",
    "organizationId": "seiser-alm-marketing",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "st-christina",
    "name": "Tourismusverein St. Christina – Gröden",
    "address": {
      "street": "Streda Chemun 9",
      "postalCode": "39047",
      "city": "St. Christina (BZ)",
      "country": "IT"
    },
    "phone": "+39 0471 777800",
    "email": "s.cristina@valgardena.it",
    "website": "https://www.valgardena.it",
    "organizationId": "val-gardena",
    "associationStatus": "local-contact-for-existing-organization"
  },
  {
    "id": "gsies",
    "name": "Tourismusgenossenschaft Gsiesertal - Welsberg - Taisten",
    "address": {
      "street": "St. Martin 10a",
      "postalCode": "39030",
      "city": "Gsiesertal",
      "country": "IT"
    },
    "phone": "+39 0474 978 436",
    "email": "info@gsieser-tal.com",
    "website": "https://www.gsieser-tal.com",
    "organizationId": "gsiesertal-welsberg-taisten",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "toblach",
    "name": "Tourismusverein Toblach",
    "address": {
      "street": "Dolomitenstraße 3",
      "postalCode": "39034",
      "city": "Toblach",
      "country": "IT"
    },
    "phone": "+39 0474 972132",
    "email": "info@toblach.info",
    "website": "https://www.dreizinnen.com",
    "organizationId": "tv-toblach",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "sexten",
    "name": "Tourismusverein Sexten",
    "address": {
      "street": "Dolomitenstraße 45",
      "postalCode": "39030",
      "city": "Sexten",
      "country": "IT"
    },
    "phone": "+39 0474 710310",
    "email": "info@sexten.it",
    "website": "https://www.dreizinnen.com",
    "organizationId": "tv-sexten",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "innichen",
    "name": "Tourismusverein Innichen",
    "address": {
      "street": "Pflegplatz 1",
      "postalCode": "39038",
      "city": "Innichen",
      "country": "IT"
    },
    "phone": "+39 0474 913149",
    "email": "info@innichen.it",
    "website": "https://www.dreizinnen.com",
    "organizationId": "tv-innichen",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "niederdorf",
    "name": "Tourismusverein Niederdorf",
    "address": {
      "street": "Bahnhofstraße 3",
      "postalCode": "39039",
      "city": "Niederdorf",
      "country": "IT"
    },
    "phone": "+39 0474 745136",
    "email": "info@niederdorf.it",
    "website": "https://www.dreizinnen.com",
    "organizationId": "tv-niederdorf",
    "associationStatus": "candidate-existing-id"
  },
  {
    "id": "prags",
    "name": "Tourismusverein Prags",
    "address": {
      "street": "Außerprags 78",
      "postalCode": "39030",
      "city": "Prags",
      "country": "IT"
    },
    "phone": "+39 0474 748660",
    "email": "info@pragsertal.info",
    "website": "https://www.dreizinnen.com",
    "organizationId": "tv-prags",
    "associationStatus": "candidate-existing-id"
  }
] as const;
export const DNS_PUBLIC_CONTACTS_SOURCE = {
  url: 'https://www.dolomitinordicski.com/de/kontakte',
  checkedDate: '2026-10-30',
  status: 'review-required',
} as const;
export const DNS_IDENTITY_ORGANIZATION_DECISIONS = {
  cortina: { organizationId: 'servizi-ampezzo', displayName: 'SEAM', flyerOperatorContactId: 'cortina-tickets' },
  valGardena: { organizationId: 'val-gardena', localContactId: 'st-christina' },
  antholz: { organizationId: 'antholzertal', canonicalName: 'Tourismusgenossenschaft Antholzertal' },
} as const;
