import test from 'node:test';
import assert from 'node:assert/strict';
import { requestBrevoMarketingDoi, requireMarketingConsent } from '../server/digital-pass-brevo.mjs';

const consent = { holderId: 'h1', purpose: 'DNS_MARKETING', affirmative: true,
  noticeVersion: '2026-10', consentedAt: 1, source: 'digital-pass' };
const holder = { id: 'h1', email: 'ABC@example.com', emailVerifiedAt: 1, preferredLanguage: 'it' };
const args = { consent, holder, apiKey: 'dummy-not-real', templateIds: { it: 2, de: 3, en: 4 }, isSuppressed: async () => false,
  redirectionUrl: 'https://www.dolomitinordicski.com/digital-pass/marketing-confirmed' };

test('rejects absent and withdrawn consent', () => {
  assert.throws(() => requireMarketingConsent(null), /MARKETING_CONSENT_REQUIRED/);
  assert.throws(() => requireMarketingConsent({ ...consent, withdrawnAt: 3 }), /MARKETING_CONSENT_REQUIRED/);
});
test('sends only minimized DOI data, not pass information', async () => {
  let payload, headers;
  const result = await requestBrevoMarketingDoi({ ...args, fetchImpl: async (_url, options) => {
    headers = options.headers;
    payload = JSON.parse(options.body);
    return { ok: true, status: 201 };
  } });
  assert.equal(result.status, 'DOI_REQUESTED');
  assert.equal(Object.hasOwn(result, 'email'), false);
  assert.deepEqual(payload.includeListIds, [13]);
  assert.equal(payload.templateId, 2);
  assert.equal(payload.email, 'abc@example.com');
  assert.deepEqual(Object.keys(payload).sort(), ['email', 'includeListIds', 'redirectionUrl', 'templateId'].sort());
  assert.equal(headers['api-key'], 'dummy-not-real');
});
test('fails closed for unverified holder and invalid URL', async () => {
  await assert.rejects(requestBrevoMarketingDoi({ ...args, holder: { ...holder, emailVerifiedAt: null } }), /HOLDER_EMAIL_NOT_VERIFIED/);
  await assert.rejects(requestBrevoMarketingDoi({ ...args, redirectionUrl: 'http://example.com' }), /BREVO_REDIRECT_HTTPS_REQUIRED/);
});
test('provider failure never claims subscriber confirmed', async () => {
  await assert.rejects(requestBrevoMarketingDoi({ ...args, fetchImpl: async () => ({ ok: false, status: 403 }) }),
    /BREVO_DOI_REQUEST_FAILED/);
});

test('suppressed contacts are not sent to Brevo', async () => {
  let called = false;
  await assert.rejects(requestBrevoMarketingDoi({
    ...args, isSuppressed: async () => true,
    fetchImpl: async () => { called = true; return { ok: true }; },
  }), /MARKETING_SUPPRESSED/);
  assert.equal(called, false);
});
test('suppression reconciliation is required before DOI requests', async () => {
  await assert.rejects(requestBrevoMarketingDoi({
    ...args, isSuppressed: undefined,
  }), /BREVO_SUPPRESSION_CHECK_REQUIRED/);
});
