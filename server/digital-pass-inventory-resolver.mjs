/**
 * Strict server-side resolver adapter for versioned, approved Data Entry numbering rows.
 * A matrix is NOT evidence of sale. Operators still need Validate.
 * The snapshot must be loaded from a privileged, trusted backend source.
 */
export function resolveSeasonPassAssignment({ passNumber, seasonId, productCode, snapshot }) {
  if (!snapshot || snapshot.approved !== true || snapshot.seasonId !== seasonId)
    throw new Error('UNAPPROVED_NUMBERING_SNAPSHOT');
  if (typeof snapshot.revision !== 'string' || !snapshot.revision)
    throw new Error('MISSING_NUMBERING_REVISION');
  if (!/^\d{1,12}$/.test(String(passNumber).trim()))
    throw new Error('INVALID_PASS_NUMBER');
  const number = Number(String(passNumber).trim());
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('INVALID_PASS_NUMBER');
  // Select explicit canonical product codes, never human-readable localized labels.
  const matches = (snapshot.rows || []).filter(r =>
    r.productCode === productCode && r.seasonId === seasonId &&
    Number.isInteger(r.from) && Number.isInteger(r.to) &&
    r.from <= number && number <= r.to && r.organizationId
  );
  if (matches.length !== 1) throw new Error(matches.length ? 'AMBIGUOUS_PASS_NUMBER' : 'PASS_NOT_IN_MATRIX');
  const row = matches[0];
  if (row.eligibleForDnsSeasonPilot !== true) throw new Error('NOT_ELIGIBLE');
  const normalized = String(number).padStart(6, '0');
  return {
    physicalPassId: seasonId + ':' + productCode + ':' + normalized,
    organizationId: row.organizationId,
    seasonId,
    productCode,
    eligibleForDnsSeasonPilot: true,
    sourceRevision: snapshot.revision,
  };
}
