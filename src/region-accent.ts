/**
 * Canonical area identity accents sampled from the DNS website area list.
 * These are micro-accents, never substitutes for the three DNS corporate blues.
 * Keys are DNS canonical reportingArea IDs, not local UI aliases.
 */
export const DNS_REGION_ACCENT_VERSION = '1.0.0' as const;
export const DNS_REGION_ACCENTS = {
  'antholzertal': '#84A536',
  'gsiesertal-welsberg-taisten': '#B39B2C',
  'drei-zinnen': '#D96029',
  'osttirol': '#CB2025',
  'val-comelico': '#BD5171',
  'cortina-d-ampezzo': '#0090DF',
  'ahrntal': '#002875',
  'seiser-alm-dolomites-val-gardena': '#2F4492',
} as const;

export type DNSRegionAccentId = keyof typeof DNS_REGION_ACCENTS;

const LEGACY_AREA_ALIASES: Record<string, DNSRegionAccentId> = {
  'anterselva': 'antholzertal',
  'gsiesertal': 'gsiesertal-welsberg-taisten',
  '3_zinnen': 'drei-zinnen',
  'comelico': 'val-comelico',
  'cortina': 'cortina-d-ampezzo',
  'seiser_alm_val_gardena': 'seiser-alm-dolomites-val-gardena',
};
export function resolveDNSRegionAccent(areaId: string | null | undefined): string | null {
  if (!areaId) return null;
  const canonicalId = LEGACY_AREA_ALIASES[areaId] || areaId;
  return Object.prototype.hasOwnProperty.call(DNS_REGION_ACCENTS, canonicalId)
    ? DNS_REGION_ACCENTS[canonicalId as DNSRegionAccentId]
    : null;
}

/**
 * Foundation context adapter: call AFTER the verified DNS Core access grant
 * establishes the user's current area. Pass null on logout or in network scope.
 * No localStorage: permissions and user context must not leak between sessions.
 */
export function applyDNSRegionAccent(
  areaId: string | null | undefined,
  documentRoot?: Document,
): string | null {
  const color = resolveDNSRegionAccent(areaId);
  const root = documentRoot ?? (typeof document !== 'undefined' ? document : undefined);
  if (root) {
    if (color) {
      root.documentElement.style.setProperty('--dns-region-accent', color);
      root.documentElement.dataset.dnsRegionAccent = 'active';
    } else {
      root.documentElement.style.removeProperty('--dns-region-accent');
      delete root.documentElement.dataset.dnsRegionAccent;
    }
  }
  return color;
}
