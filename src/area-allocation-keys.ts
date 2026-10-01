/**
 * Central, season-scoped allocation keys used across DNS tools.
 *
 * The same source is seeded into DNS_Core / areaAllocationKeys.
 * Tools should prefer the Firestore records at runtime and may use this
 * package data as a controlled fallback.
 */
export const AREA_ALLOCATION_KEYS_VERSION = '1.0.0' as const;

export interface AreaAllocation {
  organizationId: string;
  share: number;
  fixedShare: number;
}

export interface AreaAllocationKey {
  id: string;
  seasonId: string;
  reportingAreaId: string;
  allocations: AreaAllocation[];
  active: boolean;
  revision: number;
}

export const AREA_ALLOCATION_KEYS_2026_27 = [
  {
    id: '2026-27__osttirol',
    seasonId: '2026-27',
    reportingAreaId: 'osttirol',
    allocations: [{ organizationId: 'tvb-osttirol', share: 1, fixedShare: 1 }],
    active: true,
    revision: 1,
  },
  {
    id: '2026-27__drei-zinnen',
    seasonId: '2026-27',
    reportingAreaId: 'drei-zinnen',
    allocations: [
      { organizationId: 'tv-sexten', share: 0.28, fixedShare: 0.20 },
      { organizationId: 'tv-innichen', share: 0.28, fixedShare: 0.20 },
      { organizationId: 'tv-toblach', share: 0.28, fixedShare: 0.20 },
      { organizationId: 'tv-niederdorf', share: 0.08, fixedShare: 0.20 },
      { organizationId: 'tv-prags', share: 0.08, fixedShare: 0.20 },
    ],
    active: true,
    revision: 1,
  },
  {
    id: '2026-27__cortina-d-ampezzo',
    seasonId: '2026-27',
    reportingAreaId: 'cortina-d-ampezzo',
    allocations: [{ organizationId: 'servizi-ampezzo', share: 1, fixedShare: 1 }],
    active: true,
    revision: 1,
  },
  {
    id: '2026-27__val-comelico',
    seasonId: '2026-27',
    reportingAreaId: 'val-comelico',
    allocations: [{ organizationId: 'val-comelico', share: 1, fixedShare: 1 }],
    active: true,
    revision: 1,
  },
  {
    id: '2026-27__gsiesertal-welsberg-taisten',
    seasonId: '2026-27',
    reportingAreaId: 'gsiesertal-welsberg-taisten',
    allocations: [{ organizationId: 'gsiesertal-welsberg-taisten', share: 1, fixedShare: 1 }],
    active: true,
    revision: 1,
  },
  {
    id: '2026-27__antholzertal',
    seasonId: '2026-27',
    reportingAreaId: 'antholzertal',
    allocations: [
      { organizationId: 'antholzertal', share: 0.5, fixedShare: 0.5 },
      { organizationId: 'biathlon-antholz', share: 0.5, fixedShare: 0.5 },
    ],
    active: true,
    revision: 1,
  },
  {
    id: '2026-27__ahrntal',
    seasonId: '2026-27',
    reportingAreaId: 'ahrntal',
    allocations: [
      { organizationId: 'ahrntal', share: 0.5, fixedShare: 0.5 },
      { organizationId: 'sand-in-taufers', share: 0.5, fixedShare: 0.5 },
    ],
    active: true,
    revision: 1,
  },
  {
    id: '2026-27__seiser-alm-dolomites-val-gardena',
    seasonId: '2026-27',
    reportingAreaId: 'seiser-alm-dolomites-val-gardena',
    allocations: [
      { organizationId: 'seiser-alm-marketing', share: 0.5, fixedShare: 0.5 },
      { organizationId: 'val-gardena', share: 0.5, fixedShare: 0.5 },
    ],
    active: true,
    revision: 1,
  },
] as const satisfies readonly AreaAllocationKey[];

export const AREA_ALLOCATION_KEYS = AREA_ALLOCATION_KEYS_2026_27;
