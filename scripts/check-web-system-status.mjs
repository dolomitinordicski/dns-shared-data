import fs from 'node:fs';

const source = fs.readFileSync('src/system-status.ts', 'utf8');
const expected = `// GENERATED BROWSER MIRROR — source of truth: src/system-status.ts
// Keep this file synchronized with the canonical TypeScript registry.
${source
  .replace(/export const DNS_SYSTEM_STATUS_VERSION = '([^']+)' as const;/, "export const DNS_SYSTEM_STATUS_VERSION = '$1';")
  .replace(/export const DNS_SYSTEM_STATUS_VERIFIED_AT = '([^']+)' as const;/, "export const DNS_SYSTEM_STATUS_VERIFIED_AT = '$1';")
  .replace(/export type DNSAdoptionState = [^;]+;\n\n/, '')
  .replace(/\]\s+as const;/g, '];')
  .replace(/export type DNSSystemStatusEntry = \(typeof DNS_SYSTEM_STATUS\)\[number\];\s*$/m, '')
  .trim()}\n`;

const actual = fs.readFileSync('web-runtime/system-status.js', 'utf8');
if (actual !== expected) {
  console.error('web-runtime/system-status.js is out of sync with src/system-status.ts');
  process.exit(1);
}
console.log('✓ browser System Status mirror is synchronized');
