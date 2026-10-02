/**
 * Canonical, season-scoped IDM Premium Partner billing program definitions.
 *
 * Runtime consumers should read the Firestore collection idmPremiumPrograms.
 * This package data is the governed seed/fallback source.
 */
export const IDM_PREMIUM_PROGRAMS_VERSION = '1.0.0' as const;

export interface IdmPremiumProgram {
  id: string;
  seasonId: string;
  amountPerReportingArea: number;
  reportingAreaIds: string[];
  sourceLabel: string;
  active: boolean;
  revision: number;
}

export const IDM_PREMIUM_PROGRAMS = [
  {
    id: '2026-27-idm-premium',
    seasonId: '2026-27',
    amountPerReportingArea: 15000,
    reportingAreaIds: [
      'ahrntal',
      'seiser-alm-dolomites-val-gardena',
      'drei-zinnen',
      'antholzertal',
    ],
    sourceLabel: 'IDM Premiumpartner WS2026/27',
    active: true,
    revision: 1,
  },
] as const satisfies readonly IdmPremiumProgram[];
