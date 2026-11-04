# DNS Digital Pass — Phase A consolidation and safety



## Scope and revision

Rebased consolidation of PR #171 onto main 524b5eac76ab01bdc7cfaba7f2ecf13c14c917b7. Preserves the current registration gate, main's three Firestore tests, runtime service account, Polls export, QR token design and unrelated main content. PR #168 is a historical alternative, not an additional prerequisite to merge: do not add its sender or registry alongside this implementation.



No merge into main, deploy, production data, IAM/Secret Manager/Rules changes, public activation, template changes or real email is part of Phase A.



## Architectural boundary

- Pass issuance uses Firebase identity, approved inventory, HMAC activation-code verifier and atomic registration. It has no Brevo API key, provider call or outbox dependency.

- Registration records NOT_REQUESTED in its audit event regardless of client marketing flags. Marketing consent is never inferred from service email verification or pass registration.

- Only the separate requestMarketingOptIn operation accepts explicit affirmative=true with a server-controlled separate marketing notice, verified identity and active pass. Consent and one outbox job are created atomically.

- An optional frontend checkbox must be unchecked and independent; this server PR does not add a checkbox or enable marketing. firebase-entry does not supply marketingNoticeVersion, so the opt-in route remains MARKETING_NOT_ENABLED.

- No affirmative consent means no registry opt-in, no job and no DOI call. A retry after withdrawal, suppression or uncertain provider outcome cannot create a new consent/job.

- The only application DOI sender is dispatchDoiJob, backed by the durable outbox. The legacy sendMarketingDoi path and the #168 alternative registry/sender are not included. The pre-existing manual support diagnostic is outside the application, never invoked here.

- Provider failures (401, 500, network, timeout, stalled response body) affect only marketing. An uncertain attempt becomes RECONCILIATION_REQUIRED; no automatic email replay. Pass status, QR and authentication remain independent.

- All provider requests have bounded I/O. The POST payload is exactly email, includeListIds:[13], templateId and HTTPS redirectionUrl. No pass number, activation code, QR token, GPS or arbitrary attributes.



## Consent states and revocation

PENDING_DOI -> DOI_REQUESTED only on HTTP 201. HTTP 201 is not confirmation. The independent recordVerifiedDoiConfirmation operation records DOI_CONFIRMED only after an injected server evidence verifier retrieves/authenticates an authoritative DOI confirmation event, matching email hash, list 13, template, consent revision, request time and unique evidence reference. Delivery, list membership, browser clicks and a caller boolean are rejected as proof.



No authoritative Brevo evidence adapter is implemented or wired to production by this PR. The verifier is a required dependency, mocked in tests; absent verifier fails closed. Therefore marketing integration is NOT complete and must not be enabled based on unit tests or the isolated Brevo diagnostic.



Local withdrawal is transactional and immediate. Queued jobs are cancelled; a call already in flight cannot be unsent, but late acceptance never restores consent, and needsBrevoUnsubscribe remains pending. Existing list-specific withdrawal reconciliation removes only list 13, never other lists/global subscriptions. A pending withdrawal or ambiguous timeout cannot resume sending automatically. Future reconsent requires a separate reviewed workflow.



## Templates and languages

The real acceptance evidence is template 9/list 13: HTTP 201, received email, clicked DOI and membership reported by the authorized tester. No inference is made about 2/3/4 or other IDs.



No default template mapping is shipped. An explicit templateIds mapping is required for the exact consent language, with no language fallback; untested agency IDs 2/3/4 are refused. This change does not assign template 9 to an unverified language, invent DE/EN IDs, or require three newly invented IDs. Test fixtures using it/de and ID 9 are synthetic examples, not production language configuration.



Read-only template metadata inspection accepts only explicitly configured IDs, checks the optin tag and active state, reports missing languages, and never marks metadata as proof of a real DOI test. Historical clone utilities are retained from #171 but are not called or approved for use by Phase A.



## Safety tests

The domain suite covers registration without consent/provider configuration, forged marketing flags, provider 401/500/timeouts, bounded contact body parsing, zero calls/jobs without consent, whitelist payload, DOI_REQUESTED versus DOI_CONFIRMED, verified evidence correlation/idempotency, queued/in-flight withdrawal, no replay, and registration default false with 503 before auth/Firestore.



Main's existing activation, identity/grants, monouse, concurrency, ownership, QR, revocation, public verification and registration-gate tests remain. Firestore rules tests include the marketing outbox, registry and evidence collections without changing Rules. A new Emulator scenario tests concurrent opt-in and withdrawal during a mocked in-flight DOI on demo-dns-core only.



Run domain suite: node --test tests/digital-pass-*.test.mjs

Run Emulator suite: firebase emulators:exec --config firebase.emulator.json --only firestore --project demo-dns-core "node --test tests/digital-pass-firestore.test.mjs"



## Remaining gates before a first end-to-end

1. Supply and verify the authoritative Brevo DOI event adapter; reconcile the actual DNS consent registry with traceable evidence. A mocked verifier is not a completed integration.

2. Approve the language/template mapping using only actual configured IDs; test unverified languages in a separately authorized acceptance run.

3. Review consent wording/notice version, optional frontend flow, operations for quarantined jobs, provider withdrawal and reconsent. Keep dispatcher/reconciler unscheduled meanwhile.

4. Validate IAM, enabled secret versions, inventory approval, deployed Rules equivalence, CORS and runtime settings separately before any requested deploy. Phase A changes none of these.

5. Complete the integrated Auth/Functions/Firestore Emulator journey with synthetic holders/operators and cards before proposing staging. Backend registration remains default false; public activation is a separate approval.

