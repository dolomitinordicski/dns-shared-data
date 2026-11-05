# DNS Digital Pass — Phase B: real Emulator HTTP acceptance

## Source and operational boundary
Phase A PR #171 was merged only after rechecking head c18b95e04fb03ac327c8d1e65a011844f9e40f7e, unchanged main 524b5eac76ab01bdc7cfaba7f2ecf13c14c917b7 and all four green checks. Merge commit: 452a0cfe59f88a2e04c73d805078b0ee37529b2f. Historical alternative PR #168 was closed without merging it.

Phase B adds tests and a separate test-only toolchain. It does not change the pass runtime, production defaults, Rules, IAM, Secret Manager or deployed Firebase resources. Do not deploy firebase.e2e.json. The runner hardcodes demo-dns-core, binds all emulators to 127.0.0.1 and injects only a synthetic local HMAC override. Existing environment/secret files are never overwritten.

## Reproduce
Use Node 22 and Java 21, then from repository root:

```sh
npm install --ignore-scripts --no-package-lock
npm install --prefix server --ignore-scripts --no-package-lock
npm install --prefix tools/digital-pass-e2e --ignore-scripts --no-package-lock
npm run build:package
npm run typecheck
node --test tests/digital-pass-*.test.mjs
npm run test:digital-pass:e2e
```

The isolated toolchain uses firebase-tools 15.34.2. The existing root CLI 14.12 is preserved for existing suites. CLI 14.12 cannot execute Functions SDK 7.4 workers because it still calls the removed functions.config API; importing the module alone cannot detect that failure.

The runner launches and stops Auth, Functions and Firestore twice: first registrations disabled, then enabled only on loopback. It uses file-based SDK discovery with a bounded discovery timeout and explicit synthetic values for optional parameters so no interactive prompt is needed. A synthetic Wallet issuer placeholder does not enable Wallet: signing credentials remain absent. No cloud credential or Brevo key is passed to child emulators. .env.local and .secret.local overrides are removed on normal completion/failure if unchanged.

The synthetic validity window (2020–2030) is test-only; production pilot dates remain unchanged. Do not copy local parameters or synthetic credentials to staging/production.

## Scenarios and evidence
- Two synthetic holders authenticate via email links generated and consumed entirely inside Auth Emulator (no email delivered). Two operators authenticate via password and receive grants in different synthetic organizations. An additional synthetic DNS admin is used only to verify privileged revocation.
- Real HTTP requests invoke the exported digitalPassApi in Functions Emulator, not the handler directly or a fake HTTP server.
- Preparation returns a monouse code; only its HMAC verifier is persisted. Foreign-organization prepare/Validate and registration before sale attestation are refused.
- Verified holder registers; forged marketing flags are ignored, and no marketing consent/job is created. A second holder cannot retrieve that pass.
- QR is generated from the actual HTTP recovery response, written to PNG, decoded with ZXing and checked against the local public verification endpoint. The public page contains no holder name.
- An operator with passValidation.check is accepted; the other operator, without that permission, is rejected. Anonymous validation is rejected.
- Same-holder retry is idempotent; a different-holder replay fails. Duplicate preparation fails; wrong and expired codes fail. Concurrent claims create one registration/credential; concurrent sale attestations create one effective attestation.
- Marketing opt-in remains MARKETING_NOT_ENABLED in the real runtime, while the pass is ACTIVE and usable. No Brevo call or send job occurs. The separate Phase A mock/Firestore suites cover optional explicit consent, ambiguous outcomes and authoritative-evidence reconciliation boundary.
- A regular operator cannot revoke; the synthetic admin can. The very next operator and public QR checks reject the revoked credential.
- With flag false, unauthenticated registration returns 503 REGISTRATION_DISABLED. The existing gate test additionally verifies zero auth/database calls before that response.

Evidence is generated under .digital-pass-e2e/results/: http-e2e-disabled.json, http-e2e-enabled.json, synthetic-qr.png and a standalone synthetic QR HTML preview. JSON reports contain scenario PASS/FAIL and HTTP status evidence, but no tokens or activation codes. The CI job uploads these files on success or failure.

Local development may set DNS_PASS_E2E_OUTPUT_DIR to retain evidence elsewhere. DNS_E2E_FIREBASE_CLI and DNS_E2E_DEPS_ROOT can point to an equivalent isolated tool installation; CI uses the pinned tools package by default. DNS_PASS_E2E_ONLY_MODE is restricted to disabled or enabled; absent it, both phases run.

## Readiness limits
This is an Emulator backend/Auth/QR journey with a generated QR preview, not a physical-device camera or complete Workspace UI acceptance test. Emulator email links do not prove deliverability, and emulator tokens do not prove production IAM, domains, CORS, Secret Manager injection or cloud runtime identity. CLI/SDK warning behavior is recorded separately from functional failures.

No real Brevo evidence adapter is introduced. DOI reconciliation in the DNS registry, language/template mapping beyond the tested template 9, the optional unchecked marketing UI, operational withdrawal handling and quarantine remain separate gates. Marketing is not declared complete.

A first staging proposal still requires inventory approval, staging-specific identity/permissions/secrets/origins/Rules equivalence/backup and an explicit deployment approval. No such deployment is part of Phase B.

## Reference
Local overrides follow Firebase's documented Emulator mechanism (.env.local and .secret.local): https://firebase.google.com/docs/emulator-suite/connect_functions
