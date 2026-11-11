# First single card ACTIVATE

Preparation only. Cloud configuration, merge, deploy and real-card writes need the separate authorization recorded for this release.

## Fixed scope

- Project `dns-core`, region `europe-west8`, function `digitalPassApi` only.
- Card `023981`, organisation `dolomiti-nordicski`, scope `single-card`.
- Official inventory start `101`; revision `data-entry-2026-27-af57f1aff3634da7d222064bf4b6fa7e178d4fbf47d6a3fffe5ab6f124c12cd6`.
- Official validity: `2026-11-15T00:00:00+01:00` through the exclusive end `2027-05-01T00:00:00+02:00`.
- Approved operator UID remains in private configuration, never in this repository or logs.
- New claims and issuance receive a fresh two-hour application window at authorization. Existing holder reads can continue after that window. Other 199 cards stay out of scope.
- Published privacy page: `https://dolomitinordicski.github.io/dns-shared-data/docs/digital-pass-privacy-2026-27.html`. This change proposes version `dns-digital-pass-2026-27-v2` to describe asynchronous deletion and the verified backup/log periods; it needs approval before use.

## Evidence already acquired

- PR 287 VERIFY and authenticated SMOKE run 42989052400 are completed; do not redeploy or repeat them to prepare ACTIVATE.
- The complete 200-card interval has no activation challenges, registrations or credentials as of the inventory/operator check on 11 November 2026. Recheck the specific card and inventory revision immediately before an authorized real write.
- Active DNS administrator, verified Firebase email, HMAC version 1 enabled and minimum length verified without logging its value; Workspace origin authorized for Firebase Auth.
- Cloud read on 11 November: Firestore Native in `europe-west8`, daily backups retained for 604800 seconds, 7 backups READY. PITR disabled; standard version retention 3600 seconds. No backup or shared database setting was changed.
- `_Default` log bucket retention 30 days. `_Required` administrative audit bucket retention 400 days, locked. Do not change either shared bucket.
- Existing Artifact Registry repository has no cleanup policy. The deployment wrapper handles only the exact known post-deploy cleanup prompt after proving a new ACTIVE Gen2 revision. It never retries a deploy or edits shared image policies.

## Authorized administrator configuration sequence

1. Inspect existing TTL policies and the named log exclusion; do not overwrite existing settings blindly.
2. Review the nine commands printed by `node scripts/digital-pass-retention-plan.mjs`. Enable TTL on `dnsPassDeleteAt` only for those collection groups after authorization; wait for every policy to become ACTIVE. No backfill or production deletions are part of this preparation. Documents without that namespaced timestamp are unaffected.
3. Review `node scripts/digital-pass-pilot-cloud-plan.mjs`. Apply the exact service-and-QR-path-specific request-log exclusion before any real QR is generated. Keep other request logs and mandatory administrator logs. Inspect the final exclusion filter.
4. Grant the deployer temporary `roles/cloudfunctions.admin` on `dns-core` and `roles/iam.serviceAccountUser` only on the dedicated runtime and effective compute builder. Use a single explicit UTC deadline at most two hours away. Do not reactivate the expired custom deployer role or grant Owner, Editor or global Token Creator. Runtime datastore/Auth-reader/HMAC access remains separate and unchanged.
5. Populate pilot environment secrets with the verified operator UID, organisation and card number. Populate scope, inventory start/revision, approved notice version/URL and the fresh application deadline. Configure the Workspace pilot build with the same API base and notice URL. Keep release gates false until the explicit ACTIVATE authorization and preserve main-only/Bergtripper protection.
6. Deploy the reviewed commit through `deploy-digital-pass-pilot.yml`, phase `activate`. Only this function gets browser-reachable HTTPS invocation; application authentication, the fixed operator and single-card checks remain enforced. The public bearer QR page returns status only. No project-wide public binding is authorized.
7. Check the actual live function, revision, runtime, environment, secret binding, one-instance limit and service IAM. Check forbidden origin and anonymous protected routes. Do not treat workflow success as smartphone acceptance.

## Retention operation

TTL timestamps implement the approved 2026/27 policy for newly written Digital Pass records: dynamic presentations/rate-limit records become eligible at expiry; challenge records at 30 days after expiry or consumption; registration, holder, credential, private payload and non-marketing notice evidence at the end of 31 July 2027; operational audits after one calendar year. Deletion is asynchronous and is distinct from the immediate API rejection of an expired QR.

Registration remains the durable duplicate-issuance guard after a consumed challenge is removed. Test this invariant before changing retention. Do not TTL-delete `users`, memberships, access grants, order matrices or any shared identity registry.

For the one-card pilot, the DNS operator must review deletion metrics and a scoped record count after the real test and confirm the cleanup outcome. A valid TTL policy does not prove a particular document has already been deleted. If cleanup is delayed, record and address the delay; do not claim a guaranteed 24-hour deletion SLA.

At seasonal closure, review whether the holder's Firebase Auth identity is also used by other DNS services. Removing Digital Pass records must never automatically delete a shared account. An identity used solely for this service requires a separately authorized, verified account-erasure operation by an administrator. No additional permanent Auth-delete permission is assigned to the runtime.

Deleted records can remain in existing daily backups until those backups expire (seven days). Mandatory provider audit records have their own retention. Provider processing terms are documented at `https://firebase.google.com/terms/data-processing-terms` and `https://cloud.google.com/terms/data-processing-addendum`; no new contract acceptance is performed by this procedure. Brevo is not required and marketing stays disabled.

## Stop and rollback

- On a material boundary failure, use the separately authorized emergency `stop` phase. It builds a private closed function with no secrets, no inventory/operator settings and no card writes. Local release tests run before cloud authentication; unrelated exact-commit synthetic checks cannot prevent emergency STOP.
- Verify the actual revision is private and closed, claims/registration disabled, and anonymous requests denied. Remove any residual service-level public invoker if necessary under the rollback authorization.
- STOP is containment, not deletion or card revocation: it preserves registration and audit evidence. Revoking or deleting a real credential remains a distinct, explicitly authorized data operation.
- After successful deployment and acceptance, or after containment, revoke both temporary actAs bindings and the temporary Cloud Functions Admin grant, and reset deployment/ACTIVATE approval flags to false. The timestamp condition provides a hard two-hour expiry even if cleanup is interrupted.
- Record the post-test count: one registration for `023981`, zero for the other 199 cards. Before 15 November the real QR must return `NOT_YET_VALID`; do not change dates or the system clock to obtain `VALID`.
