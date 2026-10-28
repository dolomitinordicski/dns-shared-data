# DNS Polls SSO bridge — stage 1

**Implementation status:** code and automated tests only. **Not deployed**. Does not
change existing dns-polls access, event registrations or participant security.

## Architecture

- **Identity:** Firebase Authentication in `dns-core` (same session as Workspace).
- **Access control:** DNS Core `users/{uid}` and `accessGrants`, checked on
  **every request**, including revoked token checks.
- **Data:** events remain in Firebase project `dns-polls`; no duplication into DNS Core.
- **Backend:** one DNS Core Cloud Function, using an explicitly selected
  dedicated runtime service account authorized to read/write the separate
  `dns-polls` Firestore database.
- **Response:** JSON, no cookies, no credentials in URLs; strict origin allowlist;
  no client-controlled UID, role, organization or permission.

## Stage 1 endpoints

`POST /  { "action": "events.list" }` requires `events.read`.
Returns at most 100 event metadata records, never attendees.

`POST /  { "action": "events.create", "event": {...} }` requires
`events.manage`. Strictly validates the event and creates it **closed**
to public registrations. No participant list, CSV export or public registration
is exposed by this bridge stage.

Both require `Authorization: Bearer <DNS Core ID token>` in an HTTP header.
The token never goes into URLs, iframe messages or local storage managed by us.

## Controlled deployment checklist

1. Review the Firebase Functions region against existing project residency.
2. Provision a **dedicated** Google Cloud service account for the bridge; grant
   it only the necessary Firestore IAM access on `dns-polls`, and permit the
   DNS Core Functions runtime to impersonate/use it. This is an explicit
   infrastructure change, **not** performed by merging this PR.
3. Configure `DNS_POLLS_BRIDGE_SERVICE_ACCOUNT`,
   `DNS_POLLS_ALLOWED_ORIGINS` (e.g. `https://dolomitinordicski.github.io`)
   and `DNS_POLLS_REGION`. Never use `*` for CORS.
4. Only after review explicitly export `pollsBridgeApi` from
   `server/firebase-entry.mjs`, deploy **that function only** into dns-core,
   and test real Firebase Auth, active grants, revocation and IAM boundaries.
5. Configure the frontend API base via an explicit versioned opt-in;
   then verify Workspace -> Polls without a second login. Preserve old
   UI/flows until verification. Do not display attendees with this endpoint.

**Not a deployment instruction to run automatically**: new Functions exports
and IAM must be authorized separately. No production credentials are used here.

## Planned next stage

After authenticated event listing/creation works, design independently gated
`registrations.read` and `registrations.export` API actions, audit logs,
limits, GDPR retention and deletion. Participant PII must not be published into
a shared network-wide cache or Analytics.
