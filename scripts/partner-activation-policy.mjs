export const ACTIVATION_TTL_MINUTES = 10;
export const ACTIVATION_MAX_ATTEMPTS = 5;
export function normalizePartnerEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
export function eligibleActivationContact(matches) {
  return Array.isArray(matches) && matches.length === 1 && matches[0]?.active === true
    ? matches[0] : null;
}
export function canActivateContact({ authorizedEmail, authenticatedEmail, emailVerified, active }) {
  return Boolean(active && emailVerified
    && normalizePartnerEmail(authorizedEmail)
    && normalizePartnerEmail(authorizedEmail) === normalizePartnerEmail(authenticatedEmail));
}
