import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pilotReleaseConfig} from '../scripts/prepare-digital-pass-real-pilot.mjs';
const now=Date.now();
const env={DNS_PASS_RELEASE_PHASE:'verify',DNS_PASS_DEPLOY_APPROVED:'true',DNS_PASS_PRIVACY_REVIEWED:'true',
 DNS_PASS_PILOT_ORGANIZATION_ID:'synthetic-org-a',DNS_PASS_PILOT_PASS_NUMBER:'1',DNS_PASS_PILOT_OPERATOR_UID:'synthetic-operator',
 DNS_PASS_PILOT_UNTIL:new Date(now+3600000).toISOString(),DNS_PASS_DATA_ENTRY_START_NUMBER:'1',
 DNS_PASS_INVENTORY_REVISION:'data-entry-2026-27-'+'a'.repeat(64),DNS_PASS_PRIVACY_NOTICE_VERSION:'dns-digital-pass-2026-27-synthetic-v1',
 DNS_PASS_PRIVACY_URL:'https://example.test/pass/privacy'};
test('verify/stop keep issuance off; activate remains restricted and preserves official dates',()=>{
 for(const phase of ['verify','activate','stop']){
  const c=pilotReleaseConfig({...env,DNS_PASS_RELEASE_PHASE:phase},now);
  assert.equal(c.DNS_PASS_PILOT_ENABLED,'true');assert.equal(c.DNS_PASS_SALE_CLAIM_ENABLED,phase==='activate'?'true':'false');
  assert.equal(c.DNS_PASS_REGISTRATION_ENABLED,c.DNS_PASS_SALE_CLAIM_ENABLED);
  assert.equal(c.DNS_PASS_ALLOWED_ORIGINS,'https://dolomitinordicski.github.io');
  assert.equal(c.DNS_PASS_VALID_FROM,'2026-11-15T00:00:00+01:00');assert.equal(c.DNS_GOOGLE_WALLET_ISSUER_ID,'');
  assert.equal(c.DNS_PASS_INVENTORY_SOURCE,'data-entry');
 }
});
test('release refuses missing approval, privacy, single-card scope, revision, start or excessive window',()=>{
 for(const key of Object.keys(env)){const copy={...env};delete copy[key];assert.throws(()=>pilotReleaseConfig(copy,now),key);}
 for(const changes of [
  {DNS_PASS_PILOT_UNTIL:new Date(now+5*3600000).toISOString()},
  {DNS_PASS_PILOT_UNTIL:new Date(now-1000).toISOString()},
  {DNS_PASS_PILOT_PASS_NUMBER:'1,2'},{DNS_PASS_DATA_ENTRY_START_NUMBER:'0'},
  {DNS_PASS_INVENTORY_REVISION:'review-only'},{DNS_PASS_PRIVACY_URL:'http://example.test/privacy'},
  {DNS_PASS_PRIVACY_URL:'https://example.test/privacy?token=x'}])
  assert.throws(()=>pilotReleaseConfig({...env,...changes},now));
 const closed=pilotReleaseConfig({...env,DNS_PASS_RELEASE_PHASE:'stop',DNS_PASS_PILOT_UNTIL:new Date(now-1000).toISOString()},now);
 assert.equal(closed.DNS_PASS_REGISTRATION_ENABLED,'false');assert.equal(closed.DNS_PASS_PILOT_ENABLED,'true');
});
test('manual workflow targets only digitalPassApi and cannot run from a PR or push',()=>{
 const flow=readFileSync('.github/workflows/deploy-digital-pass-pilot.yml','utf8');
 assert.match(flow,/workflow_dispatch:/);assert.doesNotMatch(flow,/^  (push|pull_request):/m);
 assert.match(flow,/functions:digital-pass:digitalPassApi/);assert.match(flow,/refs\/heads\/main/);
 assert.match(flow,/dns-digital-pass-pilot/);assert.doesNotMatch(flow,/secrets versions access/);
});
