/**
 * Provision one verified DNS Partner Hub membership.
 * Dry-run is the default. NEVER creates a Firebase user, account password
 * or a role grant. Requires an existing verified Auth user and an existing
 * partnerEstablishments record with matching establishmentId.
 *
 * Usage:
 * npm run provision:partner-hub -- --email=user@example.org --establishment=hotel-example
 * npm run provision:partner-hub -- --email=... --establishment=... --apply --confirm-project=dns-core
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const arg=(key:string)=>process.argv.find(x=>x.startsWith('--'+key+'='))?.slice(key.length+3).trim();
const email=arg('email')?.toLowerCase();
const establishmentId=arg('establishment');
const apply=process.argv.includes('--apply');
const project=process.env.GOOGLE_CLOUD_PROJECT??process.env.GCLOUD_PROJECT??process.env.FIREBASE_PROJECT_ID;
if(!email||!establishmentId||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,127}$/.test(establishmentId)){
  throw Error('Usage: --email=verified@domain --establishment=existing-id [--apply --confirm-project=dns-core]');
}
if(!apply){
  console.log(JSON.stringify({mode:'DRY_RUN',email,establishmentId,
    operations:['verify existing enabled Firebase Auth account with verified email',
      'verify existing active partner establishment', 'create membership only if absent',
      'append audit record'],writes:0},null,2));
  process.exit(0);
}
if(project!=='dns-core'||arg('confirm-project')!=='dns-core'){
  throw Error('Refusing writes without DNS Core environment and explicit --confirm-project=dns-core.');
}
initializeApp({credential:applicationDefault(),projectId:'dns-core'});
const account=await getAuth().getUserByEmail(email);
if(account.disabled||!account.emailVerified||!account.uid)throw Error('Account must be enabled and email-verified.');
const db=getFirestore();
const establishmentRef=db.collection('partnerEstablishments').doc(establishmentId);
const membershipRef=db.collection('partnerHubMemberships').doc(account.uid+'__'+establishmentId);
const auditRef=db.collection('identityAdminAudit').doc();
await db.runTransaction(async tx=>{
  const [establishment,membership]=await Promise.all([
    tx.get(establishmentRef),tx.get(membershipRef),
  ]);
  if(!establishment.exists||establishment.get('establishmentId')!==establishmentId){
    throw Error('Canonical partner establishment missing or ID mismatch.');
  }
  if(establishment.get('active')!==true){
    throw Error('Establishment must be explicitly active in canonical registry.');
  }
  if(membership.exists)throw Error('Membership already exists; no overwrite. Review/revoke via separate audited workflow.');
  tx.create(membershipRef,{
    schemaVersion:1,uid:account.uid,establishmentId,
    active:true,status:'verified',
    source:'dns-partner-hub-admin-provision',
    createdAt:FieldValue.serverTimestamp(),
    updatedAt:FieldValue.serverTimestamp(),
  });
  tx.create(auditRef,{
    action:'partner-hub-membership.provision',
    targetUid:account.uid,establishmentId,
    source:'trusted-admin-cli',
    timestamp:FieldValue.serverTimestamp(),
  });
});
console.log('Created verified Partner Hub membership with audit (no Analytics permission grant).');
