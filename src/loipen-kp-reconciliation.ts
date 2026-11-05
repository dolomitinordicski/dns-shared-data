import type { DNSLoipenCounters } from './loipen-html-adapter.js';
import type { KpFairValidation } from './seasonal-operational-data.js';

/** Comparison is diagnostic only. It never edits FAIR validation or operational records. */
export function compareDNSLoipenWithValidatedKP(
  loipen: DNSLoipenCounters,
  kp: KpFairValidation,
  options: { seasonId: string; milestoneDate: string; loipenObservedAt: string | null; maxAgeHours?: number }
) {
  if (loipen.areaId !== kp.reportingAreaId || options.seasonId !== kp.seasonId) {
    throw new Error('KP/Loipen season or reporting-area mismatch');
  }
  const fields = [kp.openedKm, kp.naturalSnowKm, kp.artificialSnowKm, kp.potentialOperationalKm];
  if (fields.some(n => !Number.isFinite(n) || n < 0) ||
      kp.naturalSnowKm + kp.artificialSnowKm > kp.openedKm + 0.001) {
    throw new Error('Invalid validated KP values');
  }
  const sourceTime = options.loipenObservedAt ? Date.parse(options.loipenObservedAt) : NaN;
  const milestoneTime = Date.parse(options.milestoneDate);
  const tolerance = (options.maxAgeHours ?? 24) * 3600000;
  const comparable = Number.isFinite(sourceTime) && Number.isFinite(milestoneTime) &&
    Math.abs(sourceTime - milestoneTime) <= tolerance;
  return {
    reportingAreaId: loipen.areaId, seasonId: kp.seasonId, milestoneId: kp.milestoneId,
    loipen: { openKm: loipen.openKm, totalKm: loipen.totalKm },
    kp: { openedKm: kp.openedKm, potentialOperationalKm: kp.potentialOperationalKm,
      naturalSnowKm: kp.naturalSnowKm, artificialSnowKm: kp.artificialSnowKm },
    status: comparable ? 'comparable' as const : 'time-mismatch-or-unverified' as const,
    deltaOpenKm: comparable ? loipen.openKm - kp.openedKm : null,
    // Different definitions: website totalKm may not equal KP potentialOperationalKm.
    deltaPotentialKm: null
  };
}
