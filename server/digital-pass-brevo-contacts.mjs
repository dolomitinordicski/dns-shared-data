/** Server-only Brevo contact reconciliation. No browser imports, no console logging of PII. */
const API = 'https://api.brevo.com/v3/contacts/';
const LIST_ID = 13;
function configured(apiKey) {
  if (typeof apiKey !== 'string' || !apiKey) throw new Error('BREVO_KEY_REQUIRED');
  return { 'api-key': apiKey, accept: 'application/json' };
}
function identifier(email) {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('INVALID_EMAIL');
  return encodeURIComponent(email.trim().toLowerCase());
}
export async function getBrevoMarketingStatus({email,apiKey,fetchImpl=fetch}) {
  const response = await fetchImpl(API + identifier(email), {method:'GET',headers:configured(apiKey)});
  if (response.status === 404) return {exists:false,suppressed:false,inList:false};
  if (!response.ok) throw new Error('BREVO_LOOKUP_UNAVAILABLE');
  const c=await response.json();
  if(typeof c.emailBlacklisted!=='boolean' || !Array.isArray(c.listIds))
    throw new Error('BREVO_CONTACT_RESPONSE_UNEXPECTED');
  const listUnsubscribed = Array.isArray(c.listUnsubscribed) ? c.listUnsubscribed : [];
  return {exists:true, suppressed:c.emailBlacklisted===true || listUnsubscribed.includes(LIST_ID),
    inList:c.listIds.includes(LIST_ID), unsubscribedFromList:listUnsubscribed.includes(LIST_ID)};
}
/** Only unlink DNS Digital Pass list 13. Do not change global blacklisting
 * or membership in pre-existing Pimcore newsletter lists.
 * A non-2xx result is NOT a completed withdrawal.
 */
export async function unlinkBrevoDigitalPassList({email,apiKey,fetchImpl=fetch}) {
  const headers={...configured(apiKey),'content-type':'application/json'};
  const response=await fetchImpl(API + identifier(email),{method:'PUT',headers,
    body:JSON.stringify({unlinkListIds:[LIST_ID]})});
  if(response.status===404) return {status:'ABSENT'};
  if(!response.ok) throw new Error('BREVO_UNLINK_FAILED');
  return {status:'UNLINKED'};
}
