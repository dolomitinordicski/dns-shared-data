export const DNS_LOCALIZATION_VERSION = '1.0.0' as const;

export const DNS_UI_LANGUAGES = ['de', 'it'] as const;
export type DNSUILanguage = (typeof DNS_UI_LANGUAGES)[number];

export const DNS_CONTENT_LANGUAGES = ['de', 'it', 'bilingual'] as const;
export type DNSContentLanguage = (typeof DNS_CONTENT_LANGUAGES)[number];

export const DNS_DEFAULT_UI_LANGUAGE: DNSUILanguage = 'de';
export const DNS_FALLBACK_UI_LANGUAGE: DNSUILanguage = 'de';
export const DNS_UI_LANGUAGE_STORAGE_KEY = 'dns-ui-language-v1' as const;

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
  return new Intl.DateTimeFormat(DNS_LOCALES[language], options).format(date);
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
