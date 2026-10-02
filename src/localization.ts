export const DNS_LOCALIZATION_VERSION = '1.0.0' as const;

export const DNS_UI_LANGUAGES = ['de', 'it'] as const;
export type DNSUILanguage = (typeof DNS_UI_LANGUAGES)[number];

export const DNS_CONTENT_LANGUAGES = ['de', 'it', 'bilingual'] as const;
export type DNSContentLanguage = (typeof DNS_CONTENT_LANGUAGES)[number];

export const DNS_DEFAULT_UI_LANGUAGE: DNSUILanguage = 'de';
export const DNS_FALLBACK_UI_LANGUAGE: DNSUILanguage = 'de';
export const DNS_UI_LANGUAGE_STORAGE_KEY = 'dns-ui-language-v1' as const;
export const DNS_OPERATIONAL_TIME_ZONE = 'Europe/Rome' as const;

export const DNS_LOCALES: Record<DNSUILanguage, string> = {
  de: 'de-IT',
  it: 'it-IT',
};

export const DNS_FOUNDATION_MESSAGES = {
  'action.save': { de: 'Speichern', it: 'Salva' },
  'action.cancel': { de: 'Abbrechen', it: 'Annulla' },
  'action.confirm': { de: 'Bestätigen', it: 'Conferma' },
  'action.close': { de: 'Schließen', it: 'Chiudi' },
  'action.edit': { de: 'Bearbeiten', it: 'Modifica' },
  'action.delete': { de: 'Löschen', it: 'Elimina' },
  'action.print': { de: 'Drucken', it: 'Stampa' },
  'action.download': { de: 'Herunterladen', it: 'Scarica' },
  'action.upload': { de: 'Hochladen', it: 'Carica' },
  'action.retry': { de: 'Erneut versuchen', it: 'Riprova' },
  'action.back': { de: 'Zurück', it: 'Indietro' },
  'action.next': { de: 'Weiter', it: 'Avanti' },
  'action.search': { de: 'Suchen', it: 'Cerca' },
  'action.filter': { de: 'Filtern', it: 'Filtra' },
  'state.loading': { de: 'Wird geladen…', it: 'Caricamento…' },
  'state.empty': { de: 'Keine Daten verfügbar.', it: 'Nessun dato disponibile.' },
  'state.error': { de: 'Ein Fehler ist aufgetreten.', it: 'Si è verificato un errore.' },
  'state.offline': { de: 'Keine Verbindung.', it: 'Nessuna connessione.' },
  'state.saving': { de: 'Wird gespeichert…', it: 'Salvataggio…' },
  'state.saved': { de: 'Gespeichert.', it: 'Salvato.' },
  'state.syncing': { de: 'Synchronisierung…', it: 'Sincronizzazione…' },
  'state.stale': { de: 'Daten nicht aktuell.', it: 'Dati non aggiornati.' },
  'state.unauthorized': { de: 'Anmeldung erforderlich.', it: 'Accesso richiesto.' },
  'state.forbidden': { de: 'Kein Zugriff auf diesen Bereich.', it: 'Accesso non consentito a questa sezione.' },
  'state.notFound': { de: 'Nicht gefunden.', it: 'Non trovato.' },
  'field.required': { de: 'Pflichtfeld', it: 'Campo obbligatorio' },
  'status.ready': { de: 'Bereit', it: 'Pronto' },
  'status.draft': { de: 'Entwurf', it: 'Bozza' },
  'status.live': { de: 'Live', it: 'Live' },
  'status.locked': { de: 'Gesperrt', it: 'Bloccato' },
  'status.warning': { de: 'Hinweis', it: 'Avviso' },
  'status.error': { de: 'Fehler', it: 'Errore' },
  'status.synced': { de: 'Synchronisiert', it: 'Sincronizzato' },
  'language.de': { de: 'Deutsch', it: 'Tedesco' },
  'language.it': { de: 'Italienisch', it: 'Italiano' },
  'accessibility.open': { de: 'Barrierefreiheit', it: 'Accessibilità' },
  'accessibility.title': { de: 'Barrierefreiheit', it: 'Accessibilità' },
  'accessibility.kicker': { de: 'DNS Foundation', it: 'DNS Foundation' },
  'accessibility.textSize': { de: 'Textgröße', it: 'Dimensione testo' },
  'accessibility.standard': { de: 'Standard', it: 'Standard' },
  'accessibility.medium': { de: 'Größer', it: 'Più grande' },
  'accessibility.large': { de: 'Sehr groß', it: 'Molto grande' },
  'accessibility.highContrast': { de: 'Hoher Kontrast', it: 'Contrasto elevato' },
  'accessibility.relaxedSpacing': { de: 'Mehr Textabstand', it: 'Spaziatura testo' },
  'accessibility.reduceMotion': { de: 'Bewegung reduzieren', it: 'Riduci movimento' },
  'accessibility.strongFocus': { de: 'Fokus verstärken', it: 'Focus rinforzato' },
  'accessibility.comfortableDensity': { de: 'Komfortable Dichte', it: 'Densità confortevole' },
  'accessibility.grid': { de: 'Grid', it: 'Grid' },
  'accessibility.largeReadingText': { de: 'Sehr großer Lesetext', it: 'Testo di lettura molto grande' },
  'accessibility.reset': { de: 'Zurücksetzen', it: 'Ripristina' },
  'accessibility.close': { de: 'Schließen', it: 'Chiudi' },
  'capability.export.csv': { de: 'CSV exportieren', it: 'Esporta CSV' },
  'capability.export.xlsx': { de: 'Excel exportieren', it: 'Esporta Excel' },
  'capability.export.pdf': { de: 'PDF exportieren', it: 'Esporta PDF' },
  'capability.export.json': { de: 'JSON exportieren', it: 'Esporta JSON' },
  'capability.export.zip': { de: 'ZIP exportieren', it: 'Esporta ZIP' },
  'capability.export.bundle': { de: 'Exportpaket erstellen', it: 'Crea pacchetto export' },
  'capability.export.png': { de: 'PNG exportieren', it: 'Esporta PNG' },
  'capability.export.jpeg': { de: 'JPEG exportieren', it: 'Esporta JPEG' },
  'capability.export.svg': { de: 'SVG exportieren', it: 'Esporta SVG' },
  'capability.import.csv': { de: 'CSV importieren', it: 'Importa CSV' },
  'capability.import.xlsx': { de: 'Excel importieren', it: 'Importa Excel' },
  'capability.import.json': { de: 'JSON importieren', it: 'Importa JSON' },
  'capability.calendar.ics': { de: 'Kalenderdatei erstellen', it: 'Crea file calendario' },
  'capability.clipboard.copy': { de: 'Kopieren', it: 'Copia' },
  'capability.qr.generate': { de: 'QR-Code erstellen', it: 'Genera QR code' },
  'capability.print': { de: 'Drucken', it: 'Stampa' },
  'identity.account': { de: 'Konto', it: 'Account' },
  'identity.organization': { de: 'Organisation', it: 'Organizzazione' },
  'identity.signOut': { de: 'Abmelden', it: 'Esci' },
  'identity.accessAllowed': { de: 'Zugriff', it: 'Accesso' },
  'identity.accessRestricted': { de: 'Eingeschränkter Zugriff', it: 'Accesso limitato' },
  'identity.noAccess': { de: 'Kein Zugriff', it: 'Nessun accesso' },
  'identity.inactive': { de: 'Inaktiv', it: 'Inattivo' },
  'identity.role.viewer': { de: 'Leser', it: 'Lettore' },
  'identity.role.contributor': { de: 'Bearbeiter', it: 'Collaboratore' },
  'identity.role.reviewer': { de: 'Prüfer', it: 'Revisore' },
  'identity.role.dnsAdmin': { de: 'DNS Admin', it: 'DNS Admin' },
  'accessibility.local': {
    de: 'Einstellungen werden nur in diesem Browser gespeichert.',
    it: 'Le preferenze vengono salvate solo in questo browser.',
  },
} as const;

export type DNSFoundationMessageKey = keyof typeof DNS_FOUNDATION_MESSAGES;
export type DNSLocalizedMessages = Readonly<Record<string, Partial<Record<DNSUILanguage, string>>>>;

export function isDNSUILanguage(value: unknown): value is DNSUILanguage {
  return typeof value === 'string' && (DNS_UI_LANGUAGES as readonly string[]).includes(value);
}

export function resolveDNSUILanguage(...candidates: unknown[]): DNSUILanguage {
  for (const candidate of candidates) {
    if (isDNSUILanguage(candidate)) return candidate;
  }
  return DNS_DEFAULT_UI_LANGUAGE;
}

export function translateDNSFoundation(
  key: DNSFoundationMessageKey,
  language: DNSUILanguage = DNS_DEFAULT_UI_LANGUAGE,
): string {
  const entry = DNS_FOUNDATION_MESSAGES[key];
  return entry[language] ?? entry[DNS_FALLBACK_UI_LANGUAGE];
}

export function translateDNSMessage(
  key: string,
  messages: DNSLocalizedMessages,
  language: DNSUILanguage = DNS_DEFAULT_UI_LANGUAGE,
): string | undefined {
  const entry = messages[key];
  return entry?.[language] ?? entry?.[DNS_FALLBACK_UI_LANGUAGE];
}

export function resolveDNSLocalizedText(
  value: Partial<Record<DNSUILanguage, string>> | null | undefined,
  language: DNSUILanguage = DNS_DEFAULT_UI_LANGUAGE,
): string | undefined {
  const requested = value?.[language]?.trim();
  if (requested) return requested;
  const fallback = value?.[DNS_FALLBACK_UI_LANGUAGE]?.trim();
  return fallback || undefined;
}

export function formatDNSNumber(
  value: number,
  language: DNSUILanguage = DNS_DEFAULT_UI_LANGUAGE,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(DNS_LOCALES[language], options).format(value);
}

export function formatDNSCurrency(
  value: number,
  language: DNSUILanguage = DNS_DEFAULT_UI_LANGUAGE,
  currency = 'EUR',
  options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
): string {
  return new Intl.NumberFormat(DNS_LOCALES[language], {
    ...options,
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDNSPercent(
  value: number,
  language: DNSUILanguage = DNS_DEFAULT_UI_LANGUAGE,
  options?: Omit<Intl.NumberFormatOptions, 'style'>,
): string {
  return new Intl.NumberFormat(DNS_LOCALES[language], {
    ...options,
    style: 'percent',
  }).format(value);
}

export function formatDNSDate(
  value: Date | number | string,
  language: DNSUILanguage = DNS_DEFAULT_UI_LANGUAGE,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(DNS_LOCALES[language], {
    timeZone: DNS_OPERATIONAL_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatDNSDateTime(
  value: Date | number | string,
  language: DNSUILanguage = DNS_DEFAULT_UI_LANGUAGE,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(DNS_LOCALES[language], {
    timeZone: DNS_OPERATIONAL_TIME_ZONE,
    ...options,
  }).format(date);
}

export interface DNSLanguagePreferenceSource {
  explicit?: unknown;
  account?: unknown;
  stored?: unknown;
}

/**
 * Language resolution order is deliberate:
 * explicit session choice → authenticated account preference → stored browser preference → German.
 * Browser navigator language is intentionally not used.
 */
export function resolveDNSLanguagePreference(source: DNSLanguagePreferenceSource = {}): DNSUILanguage {
  return resolveDNSUILanguage(source.explicit, source.account, source.stored, DNS_DEFAULT_UI_LANGUAGE);
}
