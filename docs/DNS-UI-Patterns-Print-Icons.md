# DNS UI Pattern Addendum — Print Portal & Wireframe Icons

## Print portal — mandatory pattern

All DNS tools that print operational content must render a dedicated print document outside the application root.

Required pattern:

```text
<body>
  <div id="root">...</div>
  <section class="dns-print-sheet">...</section>
</body>
```

The print sheet should be mounted via a portal to `document.body`.

In print CSS:

```css
#root { display: none !important; }
.dns-print-sheet { display: block !important; }
```

Do not rely on `visibility:hidden` for the web application because hidden layout can still create phantom pages.

## Wireframe iconography

DNS tools may use small line icons to enrich visual rhythm.

Rules:

- line/wireframe only;
- monochrome / `currentColor`;
- no filled app-icon look;
- no emoji;
- no decorative AI-style pictograms;
- stroke width around 1.6;
- rounded line caps/joins;
- use sparingly.

Preferred contexts:

- section headings;
- module headings;
- compact actions;
- status/context hints.

Avoid:

- icons in every table cell;
- decorative icon walls;
- illustrations that compete with data;
- arbitrary icon variation between tools.

The goal is a small visual accent, not a second design language.
