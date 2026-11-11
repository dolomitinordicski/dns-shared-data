/** Retention dates for the approved 2026/27 Digital Pass policy.
 * Firestore TTL uses timestamps, not the numeric validity/expiry fields.
 * Enabling the namespaced TTL field is a separately approved cloud operation.
 */
export const RETENTION_FIELD = 'dnsPassDeleteAt';
export const PASS_DATA_DELETE_AT = Date.parse('2027-08-01T00:00:00+02:00');
const DAY = 86400000;
function timestamp(ms) {
  if (!Number.isFinite(ms) || !Number.isFinite(new Date(ms).getTime())) throw Error('INVALID_RETENTION_DATE');
  return { [RETENTION_FIELD]: new Date(ms) };
}
export const passDataRetention = () => timestamp(PASS_DATA_DELETE_AT);
// Eligible for deletion at expiry; provider deletion is asynchronous. Expiry is
// enforced independently by the API, even while the record awaits deletion.
export const transientRetention = expiresAt => timestamp(expiresAt);
export const activationRetention = expiresAt => timestamp(Math.min(expiresAt + 30 * DAY, PASS_DATA_DELETE_AT));
export function auditRetention(at) {
  timestamp(at);
  const date = new Date(at);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return timestamp(date.getTime());
}
export const DIGITAL_PASS_TTL_COLLECTIONS = Object.freeze([
  'passQrPresentations', 'passActivationChallenges', 'passRegistrations',
  'passHolders', 'digitalCredentials', 'passCredentialPayloads',
  'passRateLimits', 'passAuditEvents', 'consentEvents',
]);
