# Organization logos

This folder contains the primary public logos referenced by the canonical DNS organization dataset.

## Naming convention

Use the canonical organization ID as the filename:

```text
tvb-osttirol.svg
tv-toblach.svg
biathlon-antholz.png
```

Preferred format:

1. SVG
2. transparent PNG when SVG is unavailable

Use lowercase ASCII filenames with no spaces.

## Dataset link

Each organization has:

```ts
logoFile: string | null
```

Example:

```ts
{
  id: 'tvb-osttirol',
  logoFile: 'tvb-osttirol.svg'
}
```

The full repository-relative path is resolved as:

```text
assets/organization-logos/{logoFile}
```

Until the correct logo is uploaded and verified, keep:

```ts
logoFile: null
```

Do not add guessed, scraped or unofficial logo files as canonical assets.

## Future variants

If variants are needed later, use a suffix without changing the canonical organization ID, for example:

```text
tvb-osttirol--white.svg
tvb-osttirol--compact.svg
```

The canonical dataset currently references only one primary logo per organization.
