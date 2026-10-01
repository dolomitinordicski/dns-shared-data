import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const source = fs.readFileSync('src/ui/accessibility.ts', 'utf8');
const match = source.match(/DNS_ACCESSIBILITY_RUNTIME_VERSION = '([^']+)'/);
if (!match) {
  console.error('Accessibility runtime version missing from TypeScript source');
  process.exit(1);
}

const browser = await import(pathToFileURL(process.cwd() + '/web-runtime/accessibility.js').href + '?check=' + Date.now());
if (browser.DNS_ACCESSIBILITY_RUNTIME_VERSION !== match[1]) {
  console.error('Browser accessibility runtime version does not match TypeScript source');
  process.exit(1);
}

console.log('✓ browser accessibility runtime parses and matches source version');
