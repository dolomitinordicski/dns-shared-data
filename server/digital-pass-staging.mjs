/** Staging-only boundary. No default Firebase app, credentials or cloud writes. */
import {createHash} from 'node:crypto';
import {createDigitalPassHandler} from './digital-pass-http.mjs';
const invalid=()=>{throw Error('STAGING_CONFIGURATION_REQUIRED')};
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
export const stagingInventoryDigest=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export function stagingSettings(env,now=Date.now()){
 const projectId=env.DNS_PASS_STAGING_PROJECT_ID,emulated=env.FUNCTIONS_EMULATOR==='true';
 const projectPattern=emulated?/^demo-dns-pass-staging-[a-z][a-z0-9-]{0,11}$/:/^dns-pass-staging-[a-z][a-z0-9-]{0,11}$/;
 if(env.DNS_PASS_ENVIRONMENT!=='staging'||!projectPattern.test(projectId||'')||env.GCLOUD_PROJECT!==projectId)invalid();
 if(env.GOOGLE_CLOUD_PROJECT&&env.GOOGLE_CLOUD_PROJECT!==projectId)invalid();
 if(env.FIREBASE_CONFIG){let config;try{config=JSON.parse(env.FIREBASE_CONFIG)}catch{invalid()}if(config.projectId!==projectId)invalid()}
 if(env.DNS_PASS_STAGING_RUNTIME_SERVICE_ACCOUNT!==`dns-digital-pass-runtime@${projectId}.iam.gserviceaccount.com`)invalid();
 if(env.DNS_PASS_REGION!=='europe-west8'||env.DNS_PASS_DATA_MODE!=='synthetic'||env.DNS_PASS_MARKETING_ENABLED!=='false')invalid();
 for(const key of ['BREVO_API_KEY','FIREBASE_TOKEN','GOOGLE_APPLICATION_CREDENTIALS','GOOGLE_GHA_CREDS_PATH','CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE'])if(env[key])invalid();
 if(emulated){if(!/^127\.0\.0\.1:8188$/.test(env.FIRESTORE_EMULATOR_HOST||'')||!/^127\.0\.0\.1:9199$/.test(env.FIREBASE_AUTH_EMULATOR_HOST||''))invalid()}else if(env.FIRESTORE_EMULATOR_HOST||env.FIREBASE_AUTH_EMULATOR_HOST)invalid();
 const origins=(env.DNS_PASS_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(emulated?origins.length!==1||origins[0]!=='http://127.0.0.1:5179':!origins.length||origins.some(origin=>{try{const u=new URL(origin);return u.protocol!=='https:'||u.origin!==origin||u.hostname!==projectId+'.web.app'}catch{return true}}))invalid();
 const verificationBase=env.DNS_PASS_VERIFICATION_BASE;
 try{const u=new URL(verificationBase);if(emulated?verificationBase!==`http://127.0.0.1:5101/${projectId}/europe-west8/digitalPassApi`:u.protocol!=='https:'||u.host!==`europe-west8-${projectId}.cloudfunctions.net`||u.pathname!=='/digitalPassApi'||u.search||u.hash)invalid()}catch{invalid()}
 const inventoryRevision=env.DNS_PASS_INVENTORY_REVISION,inventoryHash=env.DNS_PASS_INVENTORY_SHA256;
 if(!/^synthetic-[a-z0-9-]+$/.test(inventoryRevision||'')||!/^[a-f0-9]{64}$/.test(inventoryHash||''))invalid();
 const validFrom=Date.parse(env.DNS_PASS_VALID_FROM),validUntil=Date.parse(env.DNS_PASS_VALID_UNTIL);
 if(!Number.isFinite(validFrom)||!Number.isFinite(validUntil)||validFrom>=validUntil||validUntil-validFrom>7*86400000||!/^synthetic-[a-z0-9-]+$/.test(env.DNS_PASS_PRIVACY_NOTICE_VERSION||''))invalid();
 const flag=env.DNS_PASS_REGISTRATION_ENABLED??'false';if(!['true','false'].includes(flag))invalid();
 if(flag==='true'){const until=Date.parse(env.DNS_PASS_STAGING_TEST_UNTIL);if(!Number.isFinite(until)||until<=now||until>now+4*3600000)invalid()}
 return {projectId,allowedOrigins:origins,inventoryRevision,inventoryHash,validFrom,validUntil,noticeVersion:env.DNS_PASS_PRIVACY_NOTICE_VERSION,verificationBase,registrationEnabled:flag==='true'};
}
export function assertStagingInventory(snapshot,settings){
 if(!snapshot||snapshot.synthetic!==true||snapshot.approved!==true||snapshot.schema!=='dns.digital-pass-inventory.v1'||snapshot.seasonId!=='2026-27'||snapshot.revision!==settings.inventoryRevision||!Array.isArray(snapshot.rows)||!snapshot.rows.length||snapshot.rows.some(r=>!/^synthetic-[a-z0-9-]+$/.test(r.organizationId||''))||stagingInventoryDigest(snapshot)!==settings.inventoryHash)throw Error('STAGING_SYNTHETIC_INVENTORY_REQUIRED');
}
export function createStagingPassHandler({env,createDependencies}){
 return async(req,res)=>{
  res.set('Cache-Control','no-store');
  try{
   const settings=stagingSettings(env);
   // Preserve the registration kill switch before any SDK initialization/DB/Auth.
   if(req.method==='POST'&&req.path==='/v1/pass-registrations/complete'&&!settings.registrationEnabled)return res.status(503).json({error:'REGISTRATION_DISABLED'});
   const dependencies=await createDependencies(settings);
   const snapshot=await dependencies.db.collection('passInventorySnapshots').doc(settings.inventoryRevision).get();
   assertStagingInventory(snapshot.exists?snapshot.data():null,settings);
   return await createDigitalPassHandler({...dependencies,...settings,marketingNoticeVersion:'',walletIssuerId:'',walletSigningJson:'',walletOrigins:[]})(req,res);
  }catch{
   res.set('Cache-Control','no-store');return res.status(503).json({error:'STAGING_UNAVAILABLE'});
  }
 };
}
