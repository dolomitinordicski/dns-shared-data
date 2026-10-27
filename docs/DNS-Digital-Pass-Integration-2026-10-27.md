# Digital Pass: integration status (2026-10-27)

No production deployments, migrations, secrets or authorization grants were created.

## Verified audit

- #164 is the documentation contract, based on main.
- #166 is based on #164 and initially contained only an isolated activation core and a synthetic inventory schema.
- Data Entry #72 initially resolved in-memory ranges only. Actual catalog code is `sk-dns`, not test placeholder `DNS_SEASON`.
- Workspace #7 initially had no authentication or server calls and contained a JSX syntax error. Initial CI failed; Data Entry CI passed. Shared Data heads had no PR workflow runs.
- DNS Core is the existing Firebase project `dns-core`, owned by this repository's identity schema, rules and seed tools; it is not a separate application repository. Foundation stays pinned to the existing immutable consumer releases.

## Integration order

1. Review/merge #164 (contract).
2. Review #72: export exact existing numbering rows as an unapproved, season-specific artifact. No numbering recalculation or browser approval.
3. Review #166: restrict the pilot to `2026-27/sk-dns`, normalize and hash physical identity, resolve actual Data Entry itemCode, reject all overlapping product ranges, preserve source revision, bind Validate to preparation generation, and project active DNS Core users/memberships/grants on the server.
4. Review the dependent registration/HTTP PR: Firebase Functions runtime, verified-email claim, private holder read, opaque QR credential, scan/revoke and persistent throttles.
5. Review Workspace operator and dependent customer/scanner changes. All production configuration remains absent, so service is unavailable until explicitly configured.
6. Staging/emulator acceptance and privacy review, then separately authorize deployment. Never merge a stacked PR into main before its base dependencies are incorporated/rebased.

## Runtime contract

- Operator JWTs are verified with revocation checks. Explicit active organization grants AND active memberships are required; active DNS administrators are the sole exception. Browser actor/grants fields are ignored.
- Client writes to all pass collections remain blocked by the existing final Firestore deny-all rule. No rule broadening.
- `passInventorySnapshots/{revision}` must contain an approved immutable copy of the actual printed-number allocation. The export is deliberately `approved:false`. DNS must reconcile against cards actually printed/distributed, validate using `node scripts/validate-digital-pass-inventory.mjs path.json`, verify canonical organizations, approve through trusted administration, and pin the revision. Do not promote an editable draft or public-share latest pointer automatically.
- prepare returns the secret once; only HMAC verifier is saved. A lost prepare response requires waiting for expiry/repreparing, not reading back a stored secret. Validate retry with the same generation is safe. Stale generations fail.
- Customer uses Firebase email-link sign-in/recovery. Email is re-entered on link completion and is never put into redirect parameters. A claim is finalized only after a freshly verified ID token reports email_verified. There is no reservation before verification, so abandoned email flows cannot lock a card.
- One transaction creates the registration, credential, private QR payload, consent record and audit event, and consumes the activation. One active registration per physical ID. Same-holder retry returns the committed registration; other-holder replay fails generically.
- QR is `dns-pass:v1:<256-bit random token>`. Lookup uses SHA-256 of that random token. Private holder payload allows recovery without replacing the credential. Do not export payloads to public data, Analytics or logs.
- Scans check current credential and registration state online. No public holder lookup or holder name in scan results. Revoking digital access does not change physical-sale validity.
- Marketing is NOT operational: requests are stored as PENDING_DOUBLE_OPT_IN, never valid consent. No marketing checkbox is offered until a separate delivery/confirmation/withdrawal flow and policy are approved. Service verification never counts as marketing consent.

## Configuration / release blockers

Server requires Secret Manager DNS_PASS_HMAC_KEY (real random key, no test fallback), DNS_PASS_ALLOWED_ORIGINS, DNS_PASS_INVENTORY_REVISION, DNS_PASS_VALID_FROM, DNS_PASS_VALID_UNTIL, DNS_PASS_PRIVACY_NOTICE_VERSION, and reviewed DNS_PASS_REGION. Firebase email-link provider, templates, authorized return domains, service identity/IAM, database edition/location and retention/TTL policies require verification in the actual Firebase project. Existing deployment credentials were not accessed.

Workspace requires VITE_DNS_DIGITAL_PASS_API_BASE and VITE_DNS_DIGITAL_PASS_PRIVACY_URL. Three runtime dependencies are justified: Firebase reuses existing identity/email links; qrcode renders QR locally; ZXing decodes across browsers without sending camera frames elsewhere.

Before go-live: real emulator concurrency/rules and authenticated HTTP integration; real email delivery/recovery; Android/iOS camera and responsive visual QA; approved notice/controller/processor/retention/deletion process; separate marketing DOI and withdrawal; Analytics consumer integration using existing DNS Analytics (audit events are available, no parallel analytics store). Resolve code expiry/reissue support with operations. Static QR can be copied; only online status is authoritative.

## Validation claims

Node domain tests use a serialized in-memory transaction double. They prove business outcomes, NOT Firestore isolation, real identity-provider configuration, email delivery or deployed endpoint security. No production-ready claim is made. Consult the final delivery report for exact build and CI results.

## Confirmed pilot dates and privacy link

User confirmed 15 November 2026 through 30 April 2027 inclusive, Europe/Rome.
Runtime uses [2026-11-15T00:00:00+01:00, 2027-05-01T00:00:00+02:00), with an exclusive end after the last valid day. Privacy URL: https://www.dolomitinordicski.com/de/privacy (provided by user; fetching its contents was unsuccessful, so Digital Pass coverage/legal review is NOT verified). Email-link provider status: user explicitly confirmed "Da verificare".
