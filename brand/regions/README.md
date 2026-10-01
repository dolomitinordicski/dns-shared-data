# DNS Region / Partner Logos

Canonical shared logo directory for DNS region, destination and partner assets.

## Files

SVG is the canonical format.

```text
brand/regions/
├── manifest.json
├── suedtirol.svg
├── dolomiti-bellunesi.svg
├── osttirol.svg
├── antholzertal-kronplatz.svg
├── gsiesertal-welsberg-taisten.svg
├── drei-zinnen-dolomites.svg
├── val-comelico.svg
├── consorzio-turistico-val-comelico.svg
├── cortina-dolomiti.svg
├── ahrntal-valle-aurina.svg
├── seiser-alm.svg
└── val-gardena.svg
```

## Rules

- Consumers resolve logos through `manifest.json`, not by guessing filenames.
- One DNS entity may have more than one logo asset.
- `priority: primary | secondary` decides the default when multiple assets bind to one entity.
- Composite source marks are preserved as one asset when the visual identity is intentionally combined.
- In particular, **Kronplatz + Antholzertal / Valle Anterselva is one composite asset**.
- SVG is preferred for web and print. PNG fallbacks may be added later if a target system requires raster output.
