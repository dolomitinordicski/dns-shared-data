# Closed VERIFY: deployment and authenticated smoke are separate
This procedure does not authorize a deployment or IAM change. ACTIVATE requires a new approval after VERIFY and temporary access revocation.

1. Review/merge this PR only with the explicit DNS authorization. Recheck required CI on the resulting main commit.
2. Authorize a short deployment window. An administrator may grant Cloud Functions Admin to the existing deployer for at most two hours, plus Service Account User on the dedicated runtime only. Confirm the effective builder before granting any build delegation; do not change shared builder roles.
3. Authorize and create the keyless verifier `dns-digital-pass-verify@dns-core.iam.gserviceaccount.com` if absent. No JSON key. The credential used for metadata needs only getOpenIdToken on this verifier for the IAM Credentials call. Do not add a project-wide Token Creator grant; reuse an existing covering grant only if separately reviewed.
4. Run `deploy-digital-pass-pilot.yml`, phase `verify`, confirm_target `dns-core/digitalPassApi`. The generated code stays private, closed and without secret bindings. The job checks live configuration, readiness, direct public bindings, invoker-check disablement and anonymous rejection. It records the actual builder from function/build metadata. This is NOT completed authenticated VERIFY.
5. After the actual Cloud Run service is created, an administrator authorizes a temporary `roles/run.invoker` grant to the verifier on that service only. Never grant allUsers/allAuthenticatedUsers or Run Admin to make the smoke pass.
6. Authorize `DNS_PASS_VERIFY_APPROVED=true` in `dns-digital-pass-pilot`, then run the same workflow with phase `smoke`. This job cannot deploy. It rechecks metadata and obtains an audience-bound OIDC token for the separate verifier via IAM Credentials without writing or printing credentials. Requests contain only empty JSON; the function must already be closed before any operational path is probed.
7. Check the evidence artifacts. A green metadata job is not authenticated smoke; a successful smoke is not a real card association. If smoke fails, diagnose/retry phase smoke, never automatically redeploy.
8. Revoke newly approved deployment/actAs/invoker/token permissions and close the temporary release gates. Preserve all existing runtime Firestore/Auth/HMAC/Brevo and other DNS service roles. Confirm revocation before declaring VERIFY complete.
9. Only then request new ACTIVATE approval. `DNS_PASS_ACTIVATE_APPROVED` defaults to absent/false, independently of the deployment gate. Before applying it, freshly verify one-card 023981, organization/operator, matrix revision/start, privacy and a window no longer than four hours. No ACTIVATE is performed by this PR.

## Boundaries
The script `scripts/verify-digital-pass-closed.mjs` only reads configuration/policies and probes a verified closed service; it never deploys, edits IAM, accesses secret payloads or associates a card. The metadata credential remains the existing deploy credential; the HTTP verifier is a distinct service account with no data permissions.

The current default builder is separate from the runtime. Compute was observed in the previous successful regional build. Its existing Editor grant is not changed by this PR. If another builder is selected, stop for review rather than attaching a privileged identity silently.

The script accepts only the reviewed project, region, function, one-instance limit and dedicated runtime. It fails before HTTP if the service is operational, binds secrets, contains pilot identifiers, uses an unexpected builder, or appears public. Unknown IAM deny/inherited policies still require the real anonymous and authenticated tests.

Local tests use injected synthetic metadata and HTTP responses, with no Google credentials or network. Cloud evidence is produced only by separately authorized manual jobs.
