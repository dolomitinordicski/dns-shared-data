# Digital Pass C1: isolated staging preparation and IAM proposal

This change is stacked on the QR correction PR. Nothing here creates a Firebase project, user, card, cloud secret, IAM binding, Rules release or deployment. The existing production entrypoint, runtime identity, QR architecture and Rules are unchanged.

## Separate export and project boundary

`server/firebase-staging-entry.mjs` exports only digitalPassApi; it never imports/re-exports firebase-entry or Polls. Its SDK metadata fixes private invocation, v2/europe-west8, min 0/max 1, 256 MiB/1 CPU/60 s, and only the HMAC secret name. The runtime identity parameter must match the dedicated account in the explicit staging project.

`digital-pass-staging.mjs` validates the project ID, runtime project metadata, Firebase config project, runtime identity, region, origins and verification URL before SDK initialization. Real staging IDs must match dns-pass-staging-*. Production project IDs are rejected. The named Firebase Admin app is initialized with the staging project explicitly; no default app is reused. Credentials-file overrides and a Brevo key are rejected. Emulator mode accepts only demo-dns-pass-staging-* plus loopback Auth/Firestore addresses; remote emulator addresses and production project IDs fail closed.

Registration defaults false and returns 503 REGISTRATION_DISABLED before SDK/DB/Auth access. A temporary true flag additionally requires a future test deadline no more than four hours away. Expired/missing windows fail closed. This code does not enable registrations anywhere.

Before other requests reach the Pass adapter, the private inventory document must be explicitly synthetic, approved as a synthetic fixture, in the 2026-27 season, use synthetic organization IDs, and match the pinned canonical SHA-256. A changed document is rejected even if its revision/approved flag is preserved. The materializer can only supply the checked-in 30-number synthetic fixture; it never reads the real numbering inventory or imports anything. Backend marketing notice stays empty; Wallet signing stays empty. No sender/dispatcher is copied into the staging bundle and no Brevo key is bound. No NAT/static IP/VPC connector is configured.

## Prepare locally, without deploying

After checking out the branch, use Node 22. For a proposed real staging project ID (availability/creation still require approval):

```sh
node scripts/prepare-digital-pass-staging.mjs dns-pass-staging-c1
```

The script writes an ignored `.digital-pass-staging/` directory once and refuses overwriting it. It materializes only the transitively imported Pass modules, a staging-only package.json and checked-in dependency lock, a private-function firebase.json and .firebaserc, non-secret parameters with registrations false, and the synthetic inventory as a local file. It never runs Firebase/gcloud/npm or seeds Auth/Firestore. Runtime project metadata is not placed in dotenv files; Firebase supplies it. No HMAC value/default is generated or copied. No Firestore Rules configuration is included. Install the locked runtime graph with npm ci; a release vulnerability review remains a separate approval gate.

Do not copy Emulator overrides to a cloud environment. Never deploy the repository's generic entrypoint/codebase as the staging function, and never point Workspace's existing hard-coded dns-core Auth client at this backend. The initial staging is backend-only; a separately reviewed frontend Auth/configuration adaptation and protected browser access are still required before device acceptance. A public Firebase website alone does not grant private Cloud Run invocation.

## Local staging acceptance

```sh
node scripts/prepare-digital-pass-staging.mjs demo-dns-pass-staging-c1 --emulator
npm ci --prefix .digital-pass-staging/server --ignore-scripts
npm install --prefix tools/digital-pass-e2e --ignore-scripts --no-package-lock
node --test tests/staging/digital-pass-export.test.mjs
DNS_PASS_E2E_STAGING=true npm run test:digital-pass:e2e
```

On PowerShell set `$env:DNS_PASS_E2E_STAGING='true'` before invoking the final command. Use a fresh checkout/materialized directory when reproducing. The runner refuses existing .env/.env.PROJECT/.env.local/.secret.local, writes synthetic overrides, binds only loopback, strips cloud credential/Brevo overrides and removes its own overrides afterward. It hardcodes demo project IDs, never takes a real project argument. Both false and true phases run through the real isolated function export. Emulator execution does not verify cloud IAM/private invocation enforcement or secret injection.

Tests verify project/credential/production-domain rejection before SDK initialization, bounded registration windows, canonical inventory pinning, rejection of non-synthetic/modified inventory before Auth, and actual Firebase SDK export metadata (one private function, intended runtime param, HMAC only). Existing HTTP acceptance verifies two holders/two operators, activation/recovery/QR, access denials, concurrent claims/retries/expiry, revocation, optional marketing disabled and 503. CI adds this staging journey and retains three independent regular E2E repetitions. All must be green on the exact reviewed head.

## IAM proposal: not applied

See `docs/proposals/digital-pass-staging-iam.json`. All IDs are placeholders/proposals, not existing resources or approvals.

| Need | Identity | Proposed role | Binding resource |
|---|---|---|---|
| Check revoked/disabled Auth user | dns-digital-pass-runtime@STAGING_PROJECT.iam.gserviceaccount.com | Project custom role dnsPassAuthUserReader, only firebaseauth.users.get | STAGING_PROJECT only |
| Attach runtime during deployment | dns-digital-pass-deployer@STAGING_PROJECT.iam.gserviceaccount.com | roles/iam.serviceAccountUser (or custom role with only iam.serviceAccounts.actAs if approved) | Only the dedicated runtime service account |
| Pass transactions | Runtime above | roles/datastore.user | Only staging default database, database-name IAM condition |
| HMAC injection | Runtime above | roles/secretmanager.secretAccessor | Only staging DNS_PASS_HMAC_KEY |

The Auth permission is necessarily project-scoped, not per holder: isolation keeps production users out of that scope. The custom reader excludes password-hash configuration and all mutations. The predefined Auth Viewer alternative is broader than the one-permission custom role. Token Creator is not a substitute for actAs. Do not grant actAs at project level or reuse a production Admin SDK key. Prefer a separate deployer with WIF restricted to the approved repository/ref/environment. Build/Functions/Artifact Registry/service-agent permissions must be reviewed as a separate explicit deployment permission set; actAs alone is not a complete deploy authorization.

The historical Phase C findings concern dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com (Auth get missing) and firebase-adminsdk-fbsvc@dns-core.iam.gserviceaccount.com (actAs missing on that runtime). No bindings on dns-core are changed/proposed for application as part of C1. Fixing a future production pilot requires its own resource-specific approval.

Primary references: https://docs.cloud.google.com/iam/docs/roles-permissions/firebaseauth and https://docs.cloud.google.com/iam/docs/service-account-permissions .

## Readiness gates and rollback

No cloud GO until: QR/staging branch CI is green; approved changes reach the intended release revision and CI is green there; a separate project is approved/provisioned; IAM is approved and verified; HMAC metadata/injection, private invoker, CORS/Auth, Rules equivalence and backup/restore are verified in that project. Real inventory remains excluded. Existing main can remain red until the authorized QR fix is merged by a later decision; this PR does not authorize that merge.

Initial cloud parameters remain false/marketing off. After a separately approved private synthetic test window, restore flag false and close runner access. On failure return to the previous approved artifact/configuration with registrations false, preserve HMAC/audit records, and restore synthetic data only into a new database if needed. No rollback action is executed here. Real-camera, frontend, cloud IAM and restore drills are still open acceptance gates; the pure-renderer test does not claim camera validation.
