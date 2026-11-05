/**
 * DNS Partnerbetriebe / alloggi specializzati criteria from the official DNS document.
 * Source: DNS_Qualitätskriterien-criteri di qualità (akt. 2025).pdf, p. 8
 * "Kriterien für spezialisierte Betriebe / Criteri per alloggi specializzati"
 * Last update stated in document: 09.12.2025.
 *
 * The official DE/IT text is summarized without adding extra obligations.
 * EN is a working translation; the source does NOT classify each criterion as
 * "mandatory" vs "optional". This data is NOT an automatic certification decision.
 */
export const DNS_PARTNER_QUALITY_SOURCE = {
  id: 'dns-specialized-accommodations-2025',
  title: 'DNS Qualitätskriterien / Criteri di qualità (akt. 2025)',
  updated: '2025-12-09',
  page: 8,
  url: 'https://drive.google.com/file/d/13Vr5UurOPtXXJ2l1FokndujaMkdBUq0Y/view',
} as const;

export type DNSPartnerCriterionText = { de: string; it: string; en: string };
export type DNSPartnerCriterionPhase = 'requirement' | 'conditional' | 'post-review';
export interface DNSPartnerQualityCriterion {
  id: string;
  title: DNSPartnerCriterionText;
  description: DNSPartnerCriterionText;
  phase: DNSPartnerCriterionPhase;
  icon: 'MapPin' | 'Info' | 'ShieldCheck' | 'Utensils' | 'Shirt' | 'Ticket' | 'Globe' | 'Award';
}

export const DNS_PARTNER_QUALITY_CRITERIA: readonly DNSPartnerQualityCriterion[] = [
  {
    id: 'proximity', icon: 'MapPin', phase: 'requirement',
    title: { de: 'Loipennähe oder Shuttle', it: 'Vicinanza alle piste o navetta', en: 'Trail proximity or shuttle' },
    description: {
      de: 'Unterkunft maximal 300 m von der Loipe entfernt oder direkter Shuttle zur Loipe mit maximal 5 Minuten Fahrzeit.',
      it: 'Alloggio a massimo 300 m dalla pista oppure navetta diretta con massimo 5 minuti di percorrenza.',
      en: 'Accommodation within 300 m of a trail, or a direct shuttle taking at most 5 minutes.',
    },
  },
  {
    id: 'information', icon: 'Info', phase: 'requirement',
    title: { de: 'Sichtbare DNS-Informationen', it: 'Materiale informativo DNS visibile', en: 'Visible DNS information' },
    description: {
      de: 'DNS-Unterlagen und Fachinformationen sichtbar auflegen, inklusive Routenvorschlägen, täglichem Wetterbericht sowie Luft- und Schneetemperatur.',
      it: 'Esporre materiale DNS e informazioni specialistiche, compresi itinerari suggeriti, meteo quotidiano e temperature di aria e neve.',
      en: 'Display DNS information and specialist material, including route suggestions, daily weather and air/snow temperatures.',
    },
  },
  {
    id: 'ski-room', icon: 'ShieldCheck', phase: 'requirement',
    title: { de: 'Skiraum und Wachsausrüstung', it: 'Deposito e attrezzatura per sciolinatura', en: 'Ski room and waxing equipment' },
    description: {
      de: 'Skiraum, Wachstisch, Bügeleisen mit Stromanschluss, Reparaturwerkzeuge und Pflegeutensilien für Ski anbieten.',
      it: 'Disporre di deposito sci, tavolo per sciolinatura, ferro con collegamento elettrico, attrezzi per riparazioni e cura degli sci.',
      en: 'Provide ski storage, waxing table, iron/power outlet, repair tools and ski-care equipment.',
    },
  },
  {
    id: 'breakfast', icon: 'Utensils', phase: 'conditional',
    title: { de: 'Sportlerfrühstück (falls Frühstück angeboten wird)', it: 'Colazione sportiva (per strutture con colazione)', en: 'Sports breakfast (where breakfast is served)' },
    description: {
      de: 'Viel Obst und Gemüse; nach Möglichkeit regionale, lokale und saisonale Lebensmittel.',
      it: 'Molta frutta e verdura; se possibile prodotti locali, regionali e di stagione.',
      en: 'Plenty of fruit and vegetables; preferably local, regional and seasonal foods.',
    },
  },
  {
    id: 'laundry', icon: 'Shirt', phase: 'requirement',
    title: { de: 'Wasch- und Trockenmöglichkeit', it: 'Lavaggio e asciugatura', en: 'Laundry and drying' },
    description: {
      de: 'Wasch- und Trockenraum oder entsprechenden Service anbieten.',
      it: 'Offrire un ambiente per lavaggio e asciugatura oppure un servizio equivalente.',
      en: 'Provide a laundry and drying room, or an equivalent service.',
    },
  },
  {
    id: 'ticket-sales', icon: 'Ticket', phase: 'requirement',
    title: { de: 'Online- und Vor-Ort-Ticketverkauf', it: 'Vendita biglietti online e in struttura', en: 'Online and on-site ticket sales' },
    description: {
      de: 'Ticketverkauf online auf der eigenen Website sowie analog vor Ort in der Unterkunft.',
      it: 'Vendita biglietti online sul proprio sito web e direttamente in loco presso la struttura.',
      en: 'Offer tickets online on the accommodation website and directly on site.',
    },
  },
  {
    id: 'winter-packages', icon: 'Ticket', phase: 'requirement',
    title: { de: 'Langlaufpakete mit Ticket', it: 'Pacchetti fondo con biglietto', en: 'Nordic ski packages with tickets' },
    description: {
      de: 'Im Winter Langlaufpakete anbieten, bei denen das Ticket stets enthalten ist.',
      it: 'Proporre pacchetti invernali per fondisti con biglietto sempre incluso.',
      en: 'Offer winter cross-country packages that always include a trail ticket.',
    },
  },
  {
    id: 'web-dns', icon: 'Globe', phase: 'requirement',
    title: { de: 'DNS-Informationen und Link', it: 'Informazioni e link DNS', en: 'DNS information and link' },
    description: {
      de: 'Auf der eigenen Website Informationen zu Dolomiti NordicSki inklusive Link zur DNS-Website bereitstellen.',
      it: 'Pubblicare informazioni su Dolomiti NordicSki nel proprio sito, incluso il link al sito DNS.',
      en: 'Provide Dolomiti NordicSki information on the property website, including a link to DNS.',
    },
  },
  {
    id: 'web-loipes', icon: 'Globe', phase: 'requirement',
    title: { de: 'Offene und geschlossene Loipen anzeigen', it: 'Stato piste aperte e chiuse sul sito', en: 'Show open and closed trails' },
    description: {
      de: 'Status der offenen und geschlossenen Loipen auf der Unterkunftswebsite einbinden.',
      it: 'Integrare lo stato delle piste aperte e chiuse nel sito web della struttura.',
      en: 'Display open/closed trail status on the accommodation website.',
    },
  },
  {
    id: 'plaque', icon: 'Award', phase: 'post-review',
    title: { de: 'DNS-Schild nach Prüfung', it: 'Targa DNS dopo la verifica', en: 'DNS plaque after review' },
    description: {
      de: 'Nach erfolgter Prüfung das DNS-Schild gut sichtbar am Betrieb anbringen.',
      it: 'Esporre la targa DNS in posizione ben visibile dopo la verifica.',
      en: 'Display the DNS plaque prominently after DNS has completed the review.',
    },
  },
] as const;
