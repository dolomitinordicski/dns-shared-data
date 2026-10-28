/** Strict server-rendered Loipen counter extractor. No HTML is interpreted as an authorization to publish. */
export const DNS_LOIPEN_REGION_IDS = {
  4: 'antholzertal',
  5: 'gsiesertal-welsberg-taisten',
  6: 'drei-zinnen',
  7: 'osttirol',
  8: 'val-comelico',
  9: 'cortina-d-ampezzo',
  10: 'ahrntal',
  11: 'seiser-alm-dolomites-val-gardena',
} as const;

export type DNSLoipenRegionId = keyof typeof DNS_LOIPEN_REGION_IDS;
export type DNSLoipenCounters = {
  sourceRegionId: DNSLoipenRegionId;
  areaId: (typeof DNS_LOIPEN_REGION_IDS)[DNSLoipenRegionId];
  openTrails: number;
  totalTrails: number;
  openKm: number;
  totalKm: number;
};

function readBadge(html: string, label: 'open trails' | 'open km'): [number, number] {
  // Isolate the counter panel, then match an exact badge label after its strong count.
  const panelStart = html.indexOf('<div class="liveinfos__badges">');
  const panelEnd = html.indexOf('<div class="trails__legend-container">', panelStart);
  if (panelStart < 0 || panelEnd < 0) throw new Error('Missing Loipen counter panel');
  const panel = html.slice(panelStart, panelEnd);
  const matches = [...panel.matchAll(/<strong>\s*(\d+)\s*\/\s*(\d+)\s*<\/strong>\s*<br\s*\/?>\s*(open trails|open km)\b/gi)]
    .filter(match => match[3].toLowerCase() === label);
  if (matches.length !== 1) throw new Error('Expected exactly one Loipen ' + label + ' badge');
  const numbers = matches[0];
  const open = Number(numbers[1]), total = Number(numbers[2]);
  if (!Number.isSafeInteger(open) || !Number.isSafeInteger(total) || open > total || total < 0) {
    throw new Error('Invalid Loipen ' + label + ' counter');
  }
  return [open, total];
}

export function parseDNSLoipenHTML(html: string, expectedRegionId: DNSLoipenRegionId): DNSLoipenCounters {
  if (!html.includes('class="trails__header"') || !html.includes('id="table-trails"')) {
    throw new Error('Loipen page structure not recognized');
  }
  const match = html.match(/class="trails_regions-item"\s+data-entity-id="(\d+)"/);
  if (!match || Number(match[1]) !== expectedRegionId) throw new Error('Loipen area mismatch');
  const regionIds = DNS_LOIPEN_REGION_IDS as Record<number, string>;
  const areaId = regionIds[expectedRegionId];
  if (!areaId) throw new Error('Unknown Loipen area');
  const [openTrails, totalTrails] = readBadge(html, 'open trails');
  const [openKm, totalKm] = readBadge(html, 'open km');
  return { sourceRegionId: expectedRegionId, areaId: areaId as DNSLoipenCounters['areaId'],
    openTrails, totalTrails, openKm, totalKm };
}
