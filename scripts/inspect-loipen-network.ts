import { writeFile } from 'node:fs/promises';
import { DNS_LOIPEN_REGION_IDS, parseDNSLoipenHTML, type DNSLoipenRegionId } from '../src/loipen-html-adapter.js';
import { aggregateDNSCarouselCounters } from '../src/widget-carousel-aggregation.js';

const all = [];
for (const id of Object.keys(DNS_LOIPEN_REGION_IDS).map(Number) as DNSLoipenRegionId[]) {
  const url = new URL('https://www.dolomitinordicski.com/en/trails');
  url.searchParams.set('region', String(id));
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Accept: 'text/html', 'User-Agent': 'DNS-Loipen-Widget-ReadOnly/1.0' } });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
    throw new Error('Failed DNS Loipen area ' + id + ': ' + response.status);
  }
  const html = await response.text();
  if (html.length > 2_000_000) throw new Error('Oversize DNS Loipen response');
  all.push(parseDNSLoipenHTML(html, id));
}
const totals = aggregateDNSCarouselCounters(all);
const result = { status: 'inspection-only', source: 'dns-website-regional-loipen',
  collectedAt: new Date().toISOString(), sourceObservedAt: null,
  totals, areas: all, publicationApproved: false };
const output = process.argv[2];
if (output) await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
