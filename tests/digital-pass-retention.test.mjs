import test from 'node:test';
import assert from 'node:assert/strict';
import {MemoryDb} from './helpers/digital-pass-memory-db.mjs';
import {issueDynamicQr, resolveDynamicQr} from '../server/digital-pass-dynamic-qr.mjs';
import {prepareActivation, confirmPossession} from '../server/digital-pass-activation.mjs';
import {registerDigitalPass, limitAttempts} from '../server/digital-pass-registration.mjs';
import {RETENTION_FIELD, PASS_DATA_DELETE_AT, passDataRetention, auditRetention, activationRetention} from '../server/digital-pass-retention.mjs';

const now = Date.parse('2026-11-11T12:00:00Z');
const assignment = {physicalPassId:'synthetic-card',printedNumber:'000123',organizationId:'synthetic-org',seasonId:'2026-27',productCode:'sk-dns',sourceRevision:'synthetic',eligibleForDnsSeasonPilot:true};
const actor={uid:'synthetic-operator',isDnsAdmin:true};
const identity={uid:'synthetic-holder',email:'holder@example.test',email_verified:true};
const secret='synthetic-retention-key-never-use-in-production';
const prepare=db=>prepareActivation({db,actor,passNumber:'000123',seasonId:'2026-27',productCode:'sk-dns',resolveAssignment:async()=>assignment,hmacSecret:secret,now});

test('retention uses timestamps and preserves approved season and calendar audit boundaries',()=>{
 assert.equal(passDataRetention()[RETENTION_FIELD].toISOString(),'2027-07-31T22:00:00.000Z');
 assert.equal(PASS_DATA_DELETE_AT,passDataRetention()[RETENTION_FIELD].getTime());
 assert.equal(auditRetention(now)[RETENTION_FIELD].toISOString(),'2027-11-11T12:00:00.000Z');
 assert.equal(activationRetention(PASS_DATA_DELETE_AT-1)[RETENTION_FIELD].getTime(),PASS_DATA_DELETE_AT);
 assert.throws(()=>auditRetention(NaN),/INVALID_RETENTION_DATE/);
});

test('issuance marks only pass data and supports duplicate prevention after challenge deletion',async()=>{
 const db=new MemoryDb();db.values.set('users/shared-user',{active:true});
 const p=await prepare(db);
 assert.equal(db.values.get('passActivationChallenges/'+assignment.physicalPassId)[RETENTION_FIELD].getTime(),now+600000+30*86400000);
 await confirmPossession({db,actor,...p,now:now+1});
 await registerDigitalPass({db,identity,assignment,code:p.code,givenName:'Synthetic',familyName:'Holder',noticeVersion:'synthetic',hmacSecret:secret,now:now+2,
  validFrom:Date.parse('2026-11-15T00:00:00+01:00'),validUntil:Date.parse('2027-05-01T00:00:00+02:00')});
 for(const collection of ['passRegistrations','passHolders','digitalCredentials','passCredentialPayloads','consentEvents']) {
  const rows=[...db.values].filter(([key])=>key.startsWith(collection+'/'));
  assert.equal(rows.length,1);
  assert.equal(rows[0][1][RETENTION_FIELD].getTime(),PASS_DATA_DELETE_AT);
 }
 assert.deepEqual(db.values.get('users/shared-user'),{active:true});
 // Model provider deletion of the consumed challenge, not production deletion.
 db.values.delete('passActivationChallenges/'+assignment.physicalPassId);
 await assert.rejects(prepare(db),/PASS_ALREADY_ACTIVATED/);
 assert.equal([...db.values.keys()].filter(k=>k.startsWith('digitalCredentials/')).length,1);
 const presentation=await issueDynamicQr({db,identity,physicalPassId:assignment.physicalPassId,now:now+3});
 const qr=[...db.values].find(([key])=>key.startsWith('passQrPresentations/'))[1];
 assert.ok(qr[RETENTION_FIELD] instanceof Date);
 assert.equal(qr[RETENTION_FIELD].getTime(),presentation.qrExpiresAt);
 assert.equal(await resolveDynamicQr({db,token:presentation.qrPayload.split(':')[2],now:presentation.qrExpiresAt}),null);
 const audits=[...db.values].filter(([key])=>key.startsWith('passAuditEvents/'));
 assert.ok(audits.every(([,v])=>v[RETENTION_FIELD] instanceof Date));
});

test('rate-limit expiry remains independent of asynchronous physical deletion',async()=>{
 const db=new MemoryDb();await limitAttempts({db,key:'synthetic',max:1,windowMs:1000,now});
 const value=[...db.values.values()][0];assert.equal(value[RETENTION_FIELD].getTime(),now+1000);
 await assert.rejects(limitAttempts({db,key:'synthetic',max:1,windowMs:1000,now:now+1}),/RATE_LIMITED/);
 await limitAttempts({db,key:'synthetic',max:1,windowMs:1000,now:now+1000});
});
