# DNS Assets & Workspace Contract v1.0

**Status:** normative Foundation contract

## 1. Asset model

Canonical asset types:

```text
brand
region-logo
organization-logo
graphic
icon
photo
template
document
```

Canonical statuses:

```text
draft
active
deprecated
archived
```

Canonical usages:

```text
web
print
portal
workspace
export
download
```

Each canonical asset declares:
- stable asset ID;
- type;
- label;
- path;
- MIME type;
- status;
- owner type / owner ID;
- language;
- usages;
- optional variant, aspect ratio, dimensions, season binding, source file and checksum.

Asset IDs are language-independent and must not be derived from display labels.

## 2. Ownership and source of truth

Portal and Workspace consume canonical asset metadata. They do not become asset source-of-truth owners.

Existing repository assets remain valid:
- DNS brand files under `brand/`;
- region logos under `brand/regions/`;
- organization logos under `assets/organization-logos/`;
- shared graphics under `graphics/`.

The F7 contract normalizes metadata around them without duplicating binaries.

A future platform `assets` collection is Foundation-defined but persistence is not yet implemented.

## 3. Canonical logo rule

Do not add guessed, scraped or unofficial logos as canonical assets.

Until a logo is verified, keep the canonical entity without an asset binding rather than inventing one.

## 4. Workspace structure

Canonical regions:

```text
toolbar
canvas
inspector
mobile-panel
```

Desktop:
- toolbar across the workspace;
- canvas as the primary surface;
- optional inspector, 280–380 px.

Tablet/mobile:
- canvas remains primary;
- inspector may collapse;
- controls may move to a bottom sheet/mobile panel.

## 5. Creative boundary

> Foundation governs the authoring environment, not the authored artifact.

Foundation owns:
- workspace shell;
- toolbar chrome;
- inspector chrome;
- forms;
- dialogs;
- asset browser;
- identity;
- language;
- accessibility.

Tool owns:
- creative canvas renderer;
- creative typography/colors/composition;
- template interpretation;
- generated flyer/poster/image/PDF output.

## 6. Asset browser UI

Foundation supplies common asset-grid/card/preview/metadata/usage-tag presentation.

Selection semantics remain explicit through ARIA/state.

Search/filter/query logic and binary storage remain consumer/platform-owned.

## 7. Runtime

Workspace profile:

```ts
const foundation = initDNSFoundation({
  shellProfile: 'workspace',
});

foundation.workspaceRuntime?.setInspectorState('collapsed');
foundation.workspaceRuntime?.setMobilePanelOpen(true);
```

Package entries:

```text
@dolomitinordicski/dns-shared-data/assets
@dolomitinordicski/dns-shared-data/workspace
@dolomitinordicski/dns-shared-data/ui/assets
@dolomitinordicski/dns-shared-data/ui/workspace
```

## 8. Portal use

Partner Portal may consume:
- organization logos;
- downloadable documents;
- templates;
- graphics;
- shared brand assets.

Portal does not use the Workspace canvas contract unless it embeds an actual authoring workflow.

## 9. Persistence boundary

F7 does not:
- upload files;
- choose a storage backend;
- grant file access;
- implement CDN/storage lifecycle;
- create the future `assets` collection.

Those remain controlled platform implementation steps.

## 10. Consumer migration

Flyer Studio should replace local workspace chrome and local asset registries with the Foundation contracts while retaining its creative engine.

Partner Portal should consume the same asset metadata for organization branding and downloads.
