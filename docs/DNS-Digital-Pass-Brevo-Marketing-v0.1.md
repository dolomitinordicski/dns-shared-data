# DNS Digital Pass — Brevo marketing connector v0.1
**Status:** Proposed adapter / NOT deployed (2026-10-27)  
**Scope:** DNS Season Pass pilot only; no area passes.  
**Brevo list:** DNS Digital Pass Marketing, ID **13**  
**Sender:** Dolomiti NordicSki <welcome@dolomitinordicski.com>

## Boundary
Digital Pass email verification/OTP is **not** marketing opt-in. Digital Pass works without any newsletter consent. Brevo is the marketing delivery platform, **not** the identity or ticket database.

The DNS Consent Registry (private, server-write only) is the authority for initial consent evidence: holder ID, verified email reference, purpose `DNS_MARKETING`, notice version, explicit affirmative unchecked-by-default action, timestamp, source, language, subsequent withdrawal, provider sync state and correlation key. No card numbers, pass codes, QR credentials, location data or scans to Brevo.

## Brevo DOI
- Use official `POST /v3/contacts/doubleOptinConfirmation`, **not** immediate `POST /contacts` with list 13. Required parameters: `email`, `includeListIds:[13]`, `templateId` and `redirectionUrl`.
- Verify holder email for issuing Digital Pass separately. Only after the user **affirmatively** opts in should backend request Brevo DOI.
- Brevo DOI confirmation is separate and adds user to list 13 upon confirmation. Successful request alone means `DOI_REQUESTED`, never `SUBSCRIBED`. Do not treat clicking an arbitrary redirect as proof; use verified Brevo subscription status / authoritative webhook or secure reconciliation before marking `MARKETING_CONFIRMED` in DNS.
- Respect existing unsubscribe / suppression states. Never blindly resubscribe a Brevo contact previously opted out. Implement bidirectional unsubscribe synchronization, idempotency and reconciliation before production go-live; stop retries on withdrawn consents.
- Three DOI transactional templates required (IT, DE, EN) with `{{ params.DOIurl }}` in button URL. Configure IDs only as environment configuration (`BREVO_DOI_TEMPLATE_IT`, `_DE`, `_EN`), not hardcoded defaults.
- The email sender must be verified in Brevo and `dolomitinordicski.com` authenticated (SPF/DKIM as Brevo requires). Confirm template sender really uses `welcome@dolomitinordicski.com` before live tests.
- API key: `BREVO_API_KEY` from Secret Manager; restricted Contacts access. Never store in GitHub, browser or Firestore. The DOI API may require additional Brevo email sending permissions; validate with a restricted test key rather than assuming it works.

## Proposed runtime interface
The small server-only adapter is `server/digital-pass-brevo.mjs`. The authenticated DNS handler must implement: verification of recorded consent, verified user ownership, idempotency key, consent state updates, configurable backoff, rate limiting, suppression checks, and operational observability without leaking PII. Backend deployment is **out of scope** of this PR.
- Params: `BREVO_API_KEY` secret, three DOI template IDs, `BREVO_DOI_REDIRECT_URL` HTTPS.
- State machine: `NOT_REQUESTED -> DOI_REQUESTED -> MARKETING_CONFIRMED`; separate `WITHDRAWN` / `SUPPRESSED`; failure is retryable without duplicate subscriptions.
- Add a secure Brevo webhook/scheduled reconciliation for opt-outs; API/list reconciliation must not overwrite local negative consent.
- DNS validation API, Wallet and PRIOT never depend on Brevo availability.

## Pending manual Brevo console tasks
1. Confirm verified sender `welcome@dolomitinordicski.com`, domain DNS records and deliverability.
2. Create one or three DOI templates and configure locale-specific IDs.
3. Obtain `BREVO_API_KEY` in Google Secret Manager (never in chat or commits).
4. Configure correct HTTPS confirmation landing page URL.
5. Test sandbox/controlled opt-in, existing unsubscribed user, opt-out, retry, privacy and language; only then enable integration.
