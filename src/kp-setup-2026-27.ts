import type { KpMilestone } from './seasonal-operational-data.js';

export const KP_SETUP_SEASON_ID = '2026-27' as const;

export const KP_MILESTONES_2026_27: readonly KpMilestone[] = [
  { id: '2026-27__m1', seasonId: KP_SETUP_SEASON_ID, date: '2026-12-23', label: '23.12.2026', order: 1 },
  { id: '2026-27__m2', seasonId: KP_SETUP_SEASON_ID, date: '2027-01-06', label: '06.01.2027', order: 2 },
  { id: '2026-27__m3', seasonId: KP_SETUP_SEASON_ID, date: '2027-01-20', label: '20.01.2027', order: 3 },
] as const;
