import fs from 'node:fs';

const source = fs.readFileSync('src/data-contracts.ts', 'utf8');
const expected = `// GENERATED BROWSER MIRROR — source of truth: src/data-contracts.ts
// Keep this file synchronized with the canonical TypeScript catalog.
${source
  .replace("export const DNS_DATA_CONTRACTS_VERSION = '0.1.0' as const;", "export const DNS_DATA_CONTRACTS_VERSION = '0.1.0';")
  .replace(/\]\s+as const;\s*\n\s*export type DNSDataContract = \(typeof DNS_DATA_CONTRACTS\)\[number\];\s*$/m, '];\n')}`;

const actual = fs.readFileSync('web-runtime/data-contracts.js', 'utf8');

if (actual !== expected) {
  console.error('web-runtime/data-contracts.js is out of sync with src/data-contracts.ts');
  process.exit(1);
}

console.log('✓ browser Data Contracts mirror is synchronized');
