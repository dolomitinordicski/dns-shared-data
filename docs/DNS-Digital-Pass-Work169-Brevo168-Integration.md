# Integration decision — Work runtime #169 + Brevo #168 (2026-10-27)

## Single runtime
Use the existing Firebase Functions v2 `server/firebase-entry.mjs` from PR #169, not an independent Cloud Run web server. PR #170 was closed without merge as superseded. Target region `europe-west8`, Firestore `(default)` in `dns-core`, runtime identity `dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com`. Before deployment verify Firebase Functions runtime service account setting explicitly: assigning Secret Manager access to that principal does not automatically make the function run as that principal.

## Current integration state — IMPORTANT
PR #169 registration writes an append-only `consentEvents` document with `holderId`, `purpose:DNS_MARKETING`, `affirmative`, `status:PENDING_DOUBLE_OPT_IN` (when complete), `noticeVersion`, `consentedAt`, `source`. This is NOT the `passMarketingConsents/{holderId}` state document expected by the standalone adapter in #168. **The two PRs are NOT wired together; do not advertise them as functioning.**

In the current Work HTTP `/v1/pass-registrations/complete`, `marketingNoticeVersion` is not passed to `registerDigitalPass`; so marketing affirmative remains false, and no marketing opt-in is offered/sent. This is fail-closed and must not be bypassed.

## Required post-merge sequence before enabling marketing
1. Merge stack #164 -> #166 -> #169 after review. Keep #168 separate until adapted and tested against the merged runtime.
2. Add an optional, *unchecked* marketing checkbox with a distinct published marketing-notice version and evidence; never derive consent from Firebase email-link verification or from pass registration.
3. At registration, atomically create the immutable consent event and a private `passMarketingConsents/{uid}` state record, or use a dedicated backend function to materialize state from a verified, explicit event. Require Firebase verified identity matching holder ID. Do not send DOI while transaction commits.
4. Send the Brevo DOI asynchronously with a durable outbox, idempotency key, rate limits and retry classification; do not infer `CONFIRMED` from HTTP success. The existing #168 caller lease alone is not enough to guarantee exactly-once sends across timeouts/crashes.
5. Check provider suppression and unsubscribed state before submit; preserve already-unsubscribed contacts. Configure redirection URL, verify Brevo button `{{ params.DOIurl }}` with an isolated test, and avoid modifying Pimcore's templates.
6. Confirm DOI via authoritative Brevo status/reconciliation, not redirect click. Implement withdrawal from DNS and Brevo sync for list 13, without unsubscribing unrelated lists unless policy explicitly requires it.
7. Store `BREVO_API_KEY` in Secret Manager (created by operator); inject it only into the function handling marketing via `defineSecret`. The API key must not be visible to guest frontend nor in CI logs.
8. Sender: `welcome@dolomitinordicski.com`. Existing active Brevo template IDs: IT 2, DE 3, EN 4. Brevo marketing list ID: 13. Confirm domain sender authentication and DOI link compatibility before sending real messages.
9. Prove full E2E and GDPR withdrawal before rollout; Wallet and PRIOT are separate later phases.

## No public deployment until independent gates pass
- Real printed inventory snapshot approved and Firebase email-link tested.
- Firestore backups/restore rehearsal, GDPR notices/retention, rate limiting, auth, scanner checks.
- Production Firebase Functions public endpoint and CORS reviewed; public entrypoint does not mean authorization can be skipped.
- Explicit deploy approval after staging verification.

This integration note is intentionally non-operational: it does not claim to activate Brevo, create Cloud services, or modify production users.
