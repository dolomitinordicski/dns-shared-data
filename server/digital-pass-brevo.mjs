/**
 * DNS Digital Pass -> Brevo marketing DOI adapter (server only).
 * Does NOT verify pass identity or issue a Digital Pass.
 * No API key, list ID or credentials in client-side bundles.
 */
export const BREVO_DOI_ENDPOINT = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
export const MARKETING_SENDER = 'welcome@dolomitinordicski.com';
export const MARKETING_LIST_ID = 13;
export const EXISTING_TEMPLATE_IDS = Object.freeze({ it: 2, de: 3, en: 4 });
const LANGUAGES = new Set(['it', 'de', 'en']);

export function normalizeMarketingLanguage(lang) {
  return LANGUAGES.has(lang) ? lang : 'de';
}

export function requireMarketingConsent(record) {
  if (!record || record.purpose !== 'DNS_MARKETING' ||
      record.affirmative !== true || !record.noticeVersion ||
      !record.holderId || !record.consentedAt ||
      !record.source || record.revokedAt || record.withdrawnAt) {
    throw new Error('MARKETING_CONSENT_REQUIRED');
  }
  return record;
}

/** Caller must authenticate holder, verify email and persist consent in DNS first.
 * Brevo's DOI link confirms subscription on Brevo's side; a successful API
 * response means DOI requested, NEVER newsletter membership confirmed.
 */
export async function requestBrevoMarketingDoi({
  consent, holder, apiKey, templateIds = EXISTING_TEMPLATE_IDS, redirectionUrl,
  isSuppressed, fetchImpl = fetch,
}) {
  requireMarketingConsent(consent);
  if (typeof isSuppressed !== 'function') throw new Error('BREVO_SUPPRESSION_CHECK_REQUIRED');
  if (!holder?.emailVerifiedAt || !holder?.email ||
      holder.id !== consent.holderId) throw new Error('HOLDER_EMAIL_NOT_VERIFIED');
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('BREVO_API_KEY_MISSING');
  if (!templateIds || typeof templateIds !== 'object') throw new Error('BREVO_DOI_TEMPLATES_MISSING');
  const language = normalizeMarketingLanguage(holder.preferredLanguage);
  const templateId = templateIds[language];
  if (!Number.isSafeInteger(templateId) || templateId <= 0) throw new Error('BREVO_DOI_TEMPLATE_UNCONFIGURED');
  const url = new URL(redirectionUrl);
  if (url.protocol !== 'https:') throw new Error('BREVO_REDIRECT_HTTPS_REQUIRED');
  const email = holder.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('INVALID_EMAIL');
  if (await isSuppressed(email)) throw new Error('MARKETING_SUPPRESSED');
  const response = await fetchImpl(BREVO_DOI_ENDPOINT, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      email,
      includeListIds: [MARKETING_LIST_ID],
      templateId,
      redirectionUrl: url.toString(),
      // Only include optional contact fields if attributes exist in Brevo.
      // Do NOT sync card IDs, QR, scan history or activation secrets.
    }),
  });
  if (!response.ok) {
    // Do not print Brevo response body: it may contain contact PII.
    const error = new Error('BREVO_DOI_REQUEST_FAILED');
    error.status = response.status;
    throw error;
  }
  return { status: 'DOI_REQUESTED', listId: MARKETING_LIST_ID, language };
}
