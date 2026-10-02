# DNS Foundation release propagation

## What happens

When a published GitHub Release uses a `foundation-vX.Y.Z` tag, the
`Propagate DNS Foundation release` workflow sends that exact tag to each
registered consumer. Each consumer installs and validates the pinned version,
then opens or refreshes its reviewable update PR. Weekly and manual consumer
checks remain available as recovery paths.

The release propagation can be replayed from Actions with a previously
published tag if a dispatch needs recovery. The release itself remains an
explicit, version-controlled action.

## One-time GitHub App setup

Cross-repository workflow dispatch needs a GitHub App installation token.
The default `GITHUB_TOKEN` from dns-shared-data cannot write to the consumer
repositories.

1. Create a GitHub App owned by the DNS GitHub account.
2. Grant repository permission **Contents: Read and write**.
3. Install it on these repositories:
   - `DNS-Data-Entry`
   - `DNS-Polls-tool`
   - `fairmodel`
   - `analytics`
   - `DNS-Faktura`
   - `DNS-Flyer-Studio`
4. In `dns-shared-data`, add repository Actions secrets:
   - `DNS_FOUNDATION_PROPAGATION_APP_ID`: the App ID
   - `DNS_FOUNDATION_PROPAGATION_APP_PRIVATE_KEY`: the downloaded private key

The App installation should be restricted to the six repositories above.
Do not commit the private key or place it in a consumer repository.

## Adding a consumer

Add the repository to the central workflow's repository list, add the
`repository_dispatch` trigger to its `foundation-sync.yml`, and grant the App
installation Contents write access to it. New tools that adopt the package
should use the same consumer workflow pattern.
