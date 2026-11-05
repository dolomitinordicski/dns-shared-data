# Central privileged release controller: preparation and activation gates

This controller complements Faktura #45 and Polls #67. It does not replace the
existing System Release metadata publisher. The preparation workflow runs policy
tests on PRs and verifies a release only when manually started from Shared Data
main. It contains no cloud credential, deployment command, or production rule
mutation. The production environment gate deliberately fails closed.

## Fixed targets

| Tool | Repository | Firebase project | Deployment scope |
| --- | --- | --- | --- |
| Faktura | dolomitinordicski/DNS-Faktura | dns-core | resolvePublicConfirmation, submitPublicConfirmation only |
| Polls | dolomitinordicski/DNS-Polls-tool | dns-polls | firestore:rules only |

The verifier rejects floating refs, unknown targets, commits outside main, fork
PRs, unmerged heads, bypassable source protection, missing independent write-level
approvals on the current PR head and missing/failed required workflow runs.
Unavailable evidence (including 403 from collaborator permissions) blocks release.
Artifacts record source SHA, PR, approvers, exact project/scope and CI run IDs.

## Why production is not activated

The ordinary installation token may not be allowed to inspect collaborator
permissions across repositories. Test its access using a dedicated read-only
evidence identity before activation; never weaken verification to avoid a 403.
Faktura's preparatory source contract must first be merged through its protected
main; the same applies to Polls. This cannot be replaced by a PR-head deploy.

Activation requires a further reviewed executor commit and explicit owner
authorization for credentials/settings/deployment. The executor must:

1. Rerun evidence validation and checkout the same immutable source SHA, with
   persisted GitHub credentials disabled. Verify the allowlisted contract before
   reading paths; reject symlinks/path traversal and unlisted lifecycle hooks.
2. Run the source preflight and existing domain/emulator tests in a separate job
   without production credentials. Build and hash the exact deployment payload.
3. Obtain a dedicated identity scoped to the correct project only, after an
   independent `dns-release-approval` environment approval, main only. Never copy
   credentials into tool repositories or reuse dns-core identity for dns-polls.
4. Reverify source/payload digest and fixed target at the privileged boundary.
   Use centrally controlled Firebase config/commands; do not execute arbitrary
   source scripts with production credentials. Deploy only the allowlisted scope.
5. Record central/source SHAs, approved release PR, environment approver, workflow
   run, project, targets, payload digest and actual deployment result; perform
   controlled authorization smoke tests without creating customer data.

Keep Faktura #44 and Polls #66 separate: they harden the old route but do not make
it central. Retire the old local workflows only after an authorized central
deployment and smoke test succeeds. Retiring secrets, keys or IAM is a separate
explicitly authorized action, after checking remaining consumers.

## Acceptance evidence

Run `node --test tests/central-release-policy.test.mjs` and actionlint on the
workflow. Passing these tests demonstrates the preparation guard, not an
operational or production-certified central deployment executor.
