/** Private server adapter. Source rows come from the existing Data Entry numbering
 * export; the approval/revision must be administered by DNS, never by the browser. */
import { createHash } from 'node:crypto';
import { getDigitalPassProduct } from './digital-pass-product-registry.mjs';
export const PILOT_SEASON = '2026-27';

export function resolveSeasonPassAssignment({ passNumber, seasonId, productCode, snapshot }) {
  const definition = getDigitalPassProduct(productCode, seasonId);
  if (!definition || seasonId !== PILOT_SEASON) throw new Error('NOT_ELIGIBLE');
  if (!snapshot || snapshot.approved !== true || snapshot.seasonId !== seasonId)
    throw new Error('UNAPPROVED_NUMBERING_SNAPSHOT');
  if (typeof snapshot.revision !== 'string' || !snapshot.revision) throw new Error('MISSING_NUMBERING_REVISION');
  if (typeof passNumber !== 'string' || !/^\d{1,12}$/.test(passNumber.trim())) throw new Error('INVALID_PASS_NUMBER');
  const number = Number(passNumber.trim());
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('INVALID_PASS_NUMBER');
  if (!Array.isArray(snapshot.rows)) throw new Error('INVALID_NUMBERING_SNAPSHOT');
  // Check every overlapping row before filtering eligibility, including other products.
  // Accept the actual TicketNumberingRow.itemCode; never a localized product label.
  const matches = snapshot.rows.filter(r => Number.isSafeInteger(r.from) && Number.isSafeInteger(r.to) &&
    r.from > 0 && r.to >= r.from && r.from <= number && number <= r.to);
  if (matches.length !== 1) throw new Error(matches.length ? 'AMBIGUOUS_PASS_NUMBER' : 'PASS_NOT_IN_MATRIX');
  const row = matches[0];
  if ((row.itemCode ?? row.productCode) !== productCode ||
      typeof row.organizationId !== 'string' || !row.organizationId ||
      row.seasonId && row.seasonId !== seasonId) throw new Error('NOT_ELIGIBLE');
  const normalized = String(number).padStart(6, '0');
  return {
    physicalPassId: createHash('sha256').update(`dns-physical-pass:v1\0${seasonId}\0${productCode}\0${normalized}`).digest('hex'),
    printedNumber: normalized, organizationId: row.organizationId, seasonId, productCode,
    passDesign: definition.passDesign, walletMetadata: definition.wallet,
    eligibleForDigitalPass: true, eligibleForDnsSeasonPilot: definition.pilotEligibility.dnsSeason === true, sourceRevision: snapshot.revision,
  };
}


/** Resolve supported Digital Pass products from the authoritative matrix row.
 * Product type is inferred server-side from the printed number; callers cannot
 * relabel an instructor pass as a seasonal pass (or vice versa). */
export function resolveDigitalPassAssignment({ passNumber, seasonId, snapshot }) {
  if (seasonId !== PILOT_SEASON) throw new Error('NOT_ELIGIBLE');
  if (!snapshot || snapshot.approved !== true || snapshot.seasonId !== seasonId)
    throw new Error('UNAPPROVED_NUMBERING_SNAPSHOT');
  if (typeof snapshot.revision !== 'string' || !snapshot.revision) throw new Error('MISSING_NUMBERING_REVISION');
  if (typeof passNumber !== 'string' || !/^[0-9]{1,12}$/.test(passNumber.trim())) throw new Error('INVALID_PASS_NUMBER');
  const number = Number(passNumber.trim());
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('INVALID_PASS_NUMBER');
  if (!Array.isArray(snapshot.rows)) throw new Error('INVALID_NUMBERING_SNAPSHOT');
  const matches = snapshot.rows.filter(r => Number.isSafeInteger(r.from) && Number.isSafeInteger(r.to) &&
    r.from > 0 && r.to >= r.from && r.from <= number && number <= r.to);
  if (matches.length !== 1) throw new Error(matches.length ? 'AMBIGUOUS_PASS_NUMBER' : 'PASS_NOT_IN_MATRIX');
  const productCode = matches[0].itemCode ?? matches[0].productCode;
  if (!getDigitalPassProduct(productCode, seasonId)) throw new Error('NOT_ELIGIBLE');
  return resolveSeasonPassAssignment({ passNumber, seasonId, productCode, snapshot });
}
