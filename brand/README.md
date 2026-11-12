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
- Colori Foundation: `#AAD0D1` (DOLOMITI e scie), `#417483` (NORDICSKI), `#0D4D5E` (sciatore).
- Non sostituisce `logo-web.png` né la versione negativa destinata agli sfondi scuri. Usare solamente su superfici chiare.
- Gli applicativi possono distribuirne una copia locale byte-identica per garantire print/export e consultazione offline: SHA Git blob `b485a821ff77de98889f71f642a1047905fcbcde`.
