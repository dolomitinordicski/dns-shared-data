# DNS Brand Assets

Canonical shared brand asset directory for DNS applications.

Required files:

```text
brand/
├── logo-web.png
└── logo.png
```

- `logo-web.png` — web/application header logo.
- `logo.png` — print/PDF logo. This filename is reserved and remains stable.

DNS Design System v1.3 exposes these canonical filenames through shared tokens.

Consumer applications should reference the shared assets instead of keeping independent copies once the two PNG files are uploaded here.

## Logo vettoriale per sfondi chiari

- `logo-print-vector.svg` — nuovo logo DNS su fondo bianco/chiaro, con trasparenza e tracciati originali Adobe Illustrator provenienti dal master SVG di Flyer Studio. Le geometrie non sono state modificate.
- Colori: `#AAD0D1` per DOLOMITI e le scie, `#417483` per NORDICSKI, `#0D4D5E` per le gambe e il busto dello sciatore.
- Non sostituisce `logo-web.png` né la versione negativa destinata agli sfondi scuri. Usare solamente su superfici chiare.
- Varianti vettoriali: `logo-farbe-2025.svg`, `logo-grau-2025.svg` e `logo-white-neg.svg` (negativo bianco integrale per sfondi colorati/scuri).
- Gli applicativi possono distribuirne una copia locale byte-identica per garantire print/export e consultazione offline: SHA Git blob `90436a2460e252e3d6c51a677d2e3cee98881142`.
