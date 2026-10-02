import {
  DNS_DEFAULT_UI_LANGUAGE,
  DNS_FALLBACK_UI_LANGUAGE,
  DNS_FOUNDATION_MESSAGES,
  DNS_LOCALES,
  DNS_OPERATIONAL_TIME_ZONE,
  DNS_UI_LANGUAGES,
  DNS_UI_LANGUAGE_STORAGE_KEY,
  resolveDNSLanguagePreference,
  translateDNSFoundation,
} from '../dist/localization.js';

const errors = [];

if (JSON.stringify(DNS_UI_LANGUAGES) !== JSON.stringify(['de', 'it'])) {
  errors.push('DNS_UI_LANGUAGES must be exactly [de, it].');
}
if (DNS_DEFAULT_UI_LANGUAGE !== 'de') errors.push('Default UI language must be de.');
if (DNS_FALLBACK_UI_LANGUAGE !== 'de') errors.push('Fallback UI language must be de.');
if (DNS_UI_LANGUAGE_STORAGE_KEY !== 'dns-ui-language-v1') {
  errors.push('Unexpected shared language storage key.');
}
if (DNS_LOCALES.de !== 'de-IT') errors.push('German locale must be de-IT.');
if (DNS_LOCALES.it !== 'it-IT') errors.push('Italian locale must be it-IT.');
if (DNS_OPERATIONAL_TIME_ZONE !== 'Europe/Rome') errors.push('Operational timezone must be Europe/Rome.');

for (const [key, entry] of Object.entries(DNS_FOUNDATION_MESSAGES)) {
  if (!entry.de?.trim()) errors.push(`${key}: missing German translation.`);
  if (!entry.it?.trim()) errors.push(`${key}: missing Italian translation.`);
  if (translateDNSFoundation(key, 'de') !== entry.de) errors.push(`${key}: German resolution mismatch.`);
  if (translateDNSFoundation(key, 'it') !== entry.it) errors.push(`${key}: Italian resolution mismatch.`);
}

if (resolveDNSLanguagePreference({}) !== 'de') {
  errors.push('Empty language preference must resolve to de.');
}
if (resolveDNSLanguagePreference({ stored: 'it' }) !== 'it') {
  errors.push('Stored it preference must resolve to it.');
}
if (resolveDNSLanguagePreference({ account: 'de', stored: 'it' }) !== 'de') {
  errors.push('Account preference must override stored preference.');
}
if (resolveDNSLanguagePreference({ explicit: 'it', account: 'de', stored: 'de' }) !== 'it') {
  errors.push('Explicit session preference must have highest priority.');
}
if (resolveDNSLanguagePreference({ explicit: 'en', account: 'en', stored: 'en' }) !== 'de') {
  errors.push('Unsupported language must fall back to de.');
}

if (errors.length) {
  console.error('Localization contract validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`✓ localization contract valid (${Object.keys(DNS_FOUNDATION_MESSAGES).length} shared messages, DE primary / IT secondary)`);
