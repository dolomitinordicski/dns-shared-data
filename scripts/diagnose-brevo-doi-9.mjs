#!/usr/bin/env node
/**
 * Explicit, one-shot DOI support diagnostic. Never scheduled or imported by the
 * application. Set BREVO_API_KEY, DOI_TEST_EMAIL and DOI_REDIRECT_URL locally.
 * Sends ONE POST to Brevo; use only a consenting internal test mailbox.
 */
const key = process.env.BREVO_API_KEY;
const email = process.env.DOI_TEST_EMAIL?.trim().toLowerCase();
const redirect = process.env.DOI_REDIRECT_URL;
if (!key || !email || !redirect) {
  console.error('Missing BREVO_API_KEY, DOI_TEST_EMAIL, or DOI_REDIRECT_URL. No request sent.');
  process.exit(2);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid test email');
if (new URL(redirect).protocol !== 'https:') throw new Error('Redirect must use HTTPS');
const body = {email,includeListIds:[13],templateId:9,redirectionUrl:redirect};
console.log('Request body for Brevo support (email redacted):');
console.log(JSON.stringify({...body,email:'redacted@example.com'},null,2));
try {
 const response=await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation',{
  method:'POST',headers:{'api-key':key,'content-type':'application/json',accept:'application/json'},
  body:JSON.stringify(body),signal:AbortSignal.timeout(15000)
 });
 const payload=await response.text();
 // Redact even unexpected echo of submitted PII / credential in response.
 const safe=payload.split(email).join('[REDACTED EMAIL]').split(key).join('[REDACTED KEY]');
 console.log('HTTP status:',response.status);
 console.log('Brevo response:',safe.slice(0,3000));
 if (!response.ok)process.exitCode=1;
} catch(e) {
 console.error('Network error:',e instanceof Error?e.name:'unknown');
 process.exitCode=1;
}
