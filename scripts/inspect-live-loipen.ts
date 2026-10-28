import { DNS_LOIPEN_REGION_IDS, parseDNSLoipenHTML, type DNSLoipenRegionId } from '../src/loipen-html-adapter.js';

/** Read-only DNS website inspector. Never writes production snapshots. */
const arg = process.argv[2];
const ids = arg === '--all' ? Object.keys(DNS_LOIPEN_REGION_IDS).map(Number) :
  [Number(arg)];
if (!ids.length || ids.some(id => !Object.prototype.hasOwnProperty.call(DNS_LOIPEN_REGION_IDS, id))) {
  throw new Error('Usage: npm run inspect:loipen:live -- 5 | --all');
}

for (const regionId of ids as DNSLoipenRegionId[]) {
  const url = new URL('https://www.dolomitinordicski.com/en/trails');
  url.searchParams.set('region', String(regionId));
  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
    headers: { Accept: 'text/html', 'User-Agent': 'DNS-Core-Loipen-Inspection/1.0' }
  });
  if (!response.ok) throw new Error('Loipen HTTP ' + response.status + ' for ' + regionId);
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
    throw new Error('Loipen response was not HTML for ' + regionId);
  }
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > 2_000_000) throw new Error('Loipen response too large');
  const html = await response.text();
  if (html.length > 2_000_000) throw new Error('Loipen HTML too large');
  const counters = parseDNSLoipenHTML(html, regionId);
  process.stdout.write(JSON.stringify({
    sourceUrl: url.href,
    fetchedAt: new Date().toISOString(),
    ...counters,
    publicationStatus: 'inspection-only'
  }) + '\n');
}
