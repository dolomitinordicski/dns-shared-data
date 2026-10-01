import fs from 'node:fs';

const source = fs.readFileSync('src/design-system.ts', 'utf8');
const expected = `// GENERATED BROWSER MIRROR — source of truth: src/design-system.ts
// Keep this file synchronized with the canonical TypeScript contract.
${source
  .replace("export const DNS_DESIGN_SYSTEM_VERSION = '1.6.0' as const;", "export const DNS_DESIGN_SYSTEM_VERSION = '1.6.0';")
  .replace(/\}\s+as const;\s*\n\s*export type DNSDesignSystem = typeof DNS_DESIGN_SYSTEM;\s*$/m, '};\n')}`;

const actual = fs.readFileSync('web-runtime/design-system.js', 'utf8');

if (actual !== expected) {
  console.error('web-runtime/design-system.js is out of sync with src/design-system.ts');
  process.exit(1);
}

console.log('✓ browser Design System mirror is synchronized');
