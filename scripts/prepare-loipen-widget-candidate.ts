import { readFile, writeFile } from 'node:fs/promises';
import { DNS_LOIPEN_REGION_IDS, type DNSLoipenRegionId, parseDNSLoipenHTML } from '../src/loipen-html-adapter.js';

const htmlFile = process.argv[2];
const regionId = Number(process.argv[3]) as DNSLoipenRegionId;
const outputFile = process.argv[4];
if (!htmlFile || !outputFile || !Object.prototype.hasOwnProperty.call(DNS_LOIPEN_REGION_IDS, regionId)) {
  throw new Error('Usage: npm run prepare:loipen:widget -- <saved-response.html> <site-region-id> <candidate.json>');
}
const html = await readFile(htmlFile, 'utf8');
const counters = parseDNSLoipenHTML(html, regionId);
// A site's HTML exposes counters, NOT the timestamp at which the underlying
// feed measured the piste. This is a staging candidate, not a publishable
// DNSPublicWidgetSnapshot. Source observation and approval remain mandatory.
const candidate = {
  kind: 'dns-loipen-widget-candidate',
  publicationStatus: 'requires-source-observation-and-approval',
  source: 'dns-website-loipen',
  sourceRegionId: counters.sourceRegionId,
  areaId: counters.areaId,
  collectedAt: new Date().toISOString(),
  sourceObservedAt: null,
  counts: {
    openTrails: counters.openTrails,
    totalTrails: counters.totalTrails,
    openKm: counters.openKm,
    totalKm: counters.totalKm
  }
};
await writeFile(outputFile, JSON.stringify(candidate, null, 2) + '\n', { flag: 'wx' });
console.log('Wrote unpublishable inspection candidate: ' + outputFile);
