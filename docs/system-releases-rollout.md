# DNS System Releases — rollout gates

Do not merge or deploy solely because pull-request checks are green.

## 1. Existing indexes (mandatory)
Use a credential authorized for dns-core Firestore index inspection:

```sh
gcloud firestore indexes composite list --project=dns-core --database='(default)' --format=json > dns-core-existing-indexes.json
```

Review the complete list before deploying any indexes. Do not overwrite or delete existing indexes. The file `firestore.system-releases.indexes.json` is a **proposal**, not a complete project inventory. It is intentionally **not** referenced from `firebase.json`. Create a full reconciled configuration only after comparing the live inventory and existing repository definitions, and review any proposed deletions. Deploy indexes separately; wait for the composite index to reach READY before enabling Workspace queries.

## 2. Approval gate (mandatory)
Create GitHub Actions environment `dns-release-approval` with required reviewers and deployment branch restriction to `main`. Verify that a manual workflow waits for approval; an environment name by itself does not enforce reviewers. The release publishing workflow uses `workflow_dispatch`, a validation-only default and an immutable document ID.

## 3. Publish and read
Run the release publication workflow with `publish=false` first. Do not publish `workspace-news-example.json` (the script blocks example IDs/versions). After security rules and indexes are active, test a reviewed release with an actual DNS Admin and a limited Area Admin; confirm DNS-only/technical and draft records cannot be read by Area Admin. Verify the Workspace cockpit renders IT/DE and only authorized tools.

## 4. Production sequence
1. CI and code review on both PRs.
2. Inventory, reconcile and deploy indexes; verify READY.
3. Deploy `systemReleases` Firestore rules and verify.
4. Verify GitHub environment reviewers and manual release publishing.
5. Deploy Workspace and run role-specific smoke tests.
6. Publish the first approved entry.

No index deployment or publication is authorized by this document.
