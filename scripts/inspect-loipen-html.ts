import { readFile } from 'node:fs/promises';
import { parseDNSLoipenHTML, DNS_LOIPEN_REGION_IDS, type DNSLoipenRegionId } from '../src/loipen-html-adapter.js';

/** Safe, local-only inspection. Does not fetch, publish or write any DNS Core document. */
const file = process.argv[2];
const regionId = Number(process.argv[3]) as DNSLoipenRegionId;
if (!file || !Object.prototype.hasOwnProperty.call(DNS_LOIPEN_REGION_IDS, regionId)) {
  throw new Error('Usage: npx tsx scripts/inspect-loipen-html.ts <saved-response.html> <site-region-id>');
}
const html = await readFile(file, 'utf8');
const result = parseDNSLoipenHTML(html, regionId);
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
