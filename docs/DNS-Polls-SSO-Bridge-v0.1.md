# DNS Polls SSO bridge — controlled infrastructure release

**Release state:** source code and automatic tests prepared. Firebase Function, IAM
bindings and Polls frontend flag **not yet active**. No account passwords or
service-account JSON keys belong in the repository.

## Trust boundary

Workspace and Polls reuse the same `dns-core` Firebase Authentication browser
session on `dolomitinordicski.github.io`. The backend verifies the token
(revocation check enabled), active DNS Core user and exact active network
permission **on every request**. A dedicated DNS Core Cloud Function accesses
`dns-polls` with a separate, reviewed Google Cloud runtime service account.

Phase 1 permits only event metadata listing (`events.read`) and closed event
creation (`events.manage`). No attendee PII read/export or public sign-up is
exposed. The old Polls path remains active until deliberate frontend activation.

## Google Cloud IAM preparation — admin review required

Proposed service identity (create only if it does not already exist):

```sh
gcloud iam service-accounts create dns-polls-bridge \
  --project=dns-core --display-name="DNS Polls SSO events bridge"
```

Proposed email: `dns-polls-bridge@dns-core.iam.gserviceaccount.com`.

This identity needs **read-only** DNS Core Firestore access to user/grants
and read-only Firebase Authentication access for revoked-token checks.
For the phase-1 event API it needs Firestore read/write access in `dns-polls`.
Google documents conditional IAM bindings at database level; do not grant
`Owner`/`Editor` and do not create service-account keys.

These commands are **examples for an authorized IAM administrator**, not
commands executed by GitHub or this PR. Review existing bindings and project
policy before applying them:

```sh
SA="dns-polls-bridge@dns-core.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding dns-core \
  --member="serviceAccount:${SA}" --role=roles/firebaseauth.viewer
gcloud projects add-iam-policy-binding dns-core \
  --member="serviceAccount:${SA}" --role=roles/datastore.viewer \
  --condition='expression=resource.name=="projects/dns-core/databases/(default)",title=DNSCoreIdentityRead'
gcloud projects add-iam-policy-binding dns-polls \
  --member="serviceAccount:${SA}" --role=roles/datastore.user \
  --condition='expression=resource.name=="projects/dns-polls/databases/(default)",title=DNSPollsEventsBridge'
```

**Important limitation:** Firestore IAM is not a per-collection security
boundary. The `roles/datastore.user` binding above has privileges over the
selected **entire database**, including nested participant data, even though
the stage-1 API never reads it. Before using production PII, evaluate a
custom read/create-only role and/or separating event metadata and
registrations into distinct databases. The service identity is not assigned
to any other DNS tool.

The deployment principal also needs permission to deploy Cloud Functions
and use this runtime service account; do not reuse the runtime identity as
an unrestricted deployment credential.

## GitHub controlled release

1. Confirm IAM, region/data residency, `dns-polls` database ID, deployed
   IAM policy conditions and DNS Core Authentication permissions.
2. Configure GitHub environment `dns-polls-bridge-production` with required
   reviewer approval. Its scoped variables:
   - `DNS_POLLS_BRIDGE_SERVICE_ACCOUNT` = approved runtime service-account email
   - `DNS_POLLS_ALLOWED_ORIGINS` = `https://dolomitinordicski.github.io`
   - `DNS_POLLS_REGION` = reviewed EU Cloud Functions region
3. Confirm Actions secret `FIREBASE_SERVICE_ACCOUNT_DNS_CORE` is present
   and its deployment identity is permitted to use that runtime service account.
4. Run the GitHub Actions workflow **Deploy DNS Polls SSO bridge (manual)**
   from `main`, typing `dns-core/pollsBridgeApi`. It runs security tests
   and deploys **only** `functions:digital-pass:pollsBridgeApi` into `dns-core`.
   It must not deploy Firebase rules, the Digital Pass function or Hosting.
5. Verify API URL from a successful function deployment using a **real**
   authorized DNS Core token; test admin and network-granted user,
   expired grant, revoked token, unauthenticated request, wrong origin and
   a closed event. No attendee list or export API should exist.
6. Set Polls repository variable `VITE_DNS_POLLS_BRIDGE_URL` to the
   verified HTTPS function URL and redeploy Polls Pages.
7. Browser acceptance: log into Workspace, open Polls Events, ensure no
   second login, verify context and scope, refresh/direct URL, logout.
   Public event-registration flag remains **off**.

### Rollback

Unset `VITE_DNS_POLLS_BRIDGE_URL` and redeploy Polls Pages. Its original
organizer flow remains available. If necessary, deactivate the bridge
function without touching Digital Pass or Firestore rules.

### Current checks

- Backend authorization tests: `node --test tests/polls-access.test.mjs tests/polls-bridge.test.mjs`
- Function export loadability: `node --input-type=module -e "const m = await import('./server/firebase-entry.mjs'); if (!m.pollsBridgeApi) process.exit(1)"`
- Frontend adapter is opt-in and does not send bearer tokens in URLs.

No migration of participant data or automatic IAM changes is included.
