# DNS Digital Pass — Cloud Run bootstrap

**Not deployed.** This is a minimal HTTP process with GET /healthz and 404 for every other route. No Firestore writes, no Brevo calls, no public activation/validation endpoint.

Validated intended infrastructure:
- GCP project: `dns-core`
- Firestore (default): `europe-west8` (Milan)
- Cloud Run target: `europe-west8`
- Service name: `dns-digital-pass-api`
- Runtime identity: `dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com`
- Secret: `BREVO_API_KEY`, accessed only through a per-secret IAM grant; **not mounted or referenced by the bootstrap code**
- Min instances: 0

## Safe development
Run `npm test` inside this directory (Node 22+), or `npm start` and visit `/healthz`.

## Release gates — all mandatory before any real user traffic
1. Merge or import the canonical pass backend and Brevo consent flows only after Firestore rules, auth/organization scoping, idempotency and rate-limits are tested.
2. Deploy with authenticated invocation unless public guest routes are specifically reviewed and protected. Do not grant `allUsers` prematurely.
3. Grant the runtime IAM principal minimal Firestore privileges (Google Cloud IAM is not a substitute for per-user authorization in server code).
4. Integrate secret as an explicit Cloud Run secret reference and verify access using the runtime service account only when the DOI sender path is ready.
5. Keep API endpoints fail closed until tested; use a controlled staging test, no real marketing emails.
6. Before storing real private data: configure Firestore backups, retention and a restore test. Backup schedule currently disabled.
7. Set cost alerts and confirm max instances/concurrency; zero min instances. Verify database and service region stay aligned.
8. Keep Pimcore untouched. Existing Brevo marketing list 13 and active agency templates IT 2, DE 3, EN 4 require DOI link compatibility testing.
