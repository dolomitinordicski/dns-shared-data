import { readFile } from 'node:fs/promises';
import { isDNSPublicWidgetSnapshot } from '../src/public-widget.js';

const filename = process.argv[2];
if (!filename) throw new Error('Usage: tsx scripts/validate-public-widget-snapshot.ts <snapshot.json>');
const raw: unknown = JSON.parse(await readFile(filename, 'utf8'));
if (!isDNSPublicWidgetSnapshot(raw)) throw new Error('Invalid DNS public widget snapshot');
console.log('Widget snapshot schema validated. No publication performed.');
