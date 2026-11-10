/** Closed VERIFY checks. Metadata reads plus approved short-lived verifier token issuance.
 * No deployment, persistent IAM edits, secret payload access or card data. */
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const PROJECT='dns-core', REGION='europe-west8';
export const RUNTIME='dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com';
export const VERIFIER='dns-digital-pass-verify@dns-core.iam.gserviceaccount.com';
const ORIGIN='https://dolomitinordicski.github.io';
const fail=code=>{throw Error(code)};
export function validateClosedFunction(fn){
 if(fn.name!==`projects/${PROJECT}/locations/${REGION}/functions/digitalPassApi`||fn.state!=='ACTIVE'||fn.environment!=='GEN_2')fail('FUNCTION_NOT_ACTIVE_GEN2');
 const c=fn.serviceConfig||{},v=c.environmentVariables||{};
 if(c.serviceAccountEmail!==RUNTIME||c.maxInstanceCount!==1)fail('RUNTIME_OR_INSTANCE_BOUNDARY');
 if((c.secretEnvironmentVariables||[]).length||(c.secretVolumes||[]).length)fail('CLOSED_RELEASE_BINDS_SECRETS');
 for(const [key,value]of Object.entries({DNS_PASS_API_CLOSED:'true',DNS_PASS_PILOT_ENABLED:'false',DNS_PASS_POSSESSION_CLAIM_ENABLED:'false',DNS_PASS_REGISTRATION_ENABLED:'false'}))if(v[key]!==value)fail('CLOSED_FLAGS_REQUIRED');
 if(v.DNS_PASS_ALLOWED_ORIGINS!==ORIGIN)fail('ORIGIN_CONFIGURATION_CHANGED');
 const forbidden=['DNS_PASS_PILOT_PASS_NUMBER','DNS_PASS_PILOT_OPERATOR_UID','DNS_PASS_PILOT_ORGANIZATION_ID','DNS_PASS_INVENTORY_REVISION'];
 if(forbidden.some(k=>v[k]))fail('CLOSED_RELEASE_CONTAINS_PILOT_DATA');
 const uri=new URL(c.uri);
 if(uri.protocol!=='https:'||!uri.hostname.endsWith('.a.run.app')||uri.username||uri.password||uri.search||uri.hash||uri.pathname!=='/')fail('UNTRUSTED_SERVICE_URI');
 const match=/^projects\/(?:dns-core|387653285986)\/locations\/europe-west8\/services\/([a-z0-9-]+)$/.exec(c.service||'');
 if(!match)fail('SERVICE_RESOURCE_REQUIRED');
 return {uri:uri.origin,service:match[1],buildServiceAccount:fn.buildConfig?.serviceAccount||'',build:fn.buildConfig?.build||''};
}
export function validatePrivateService(run,policy){
 const a=run.metadata?.annotations||{};
 if(a['run.googleapis.com/invoker-iam-disabled']==='true'||run.invokerIamDisabled===true)fail('INVOKER_IAM_CHECK_DISABLED');
 if(run.spec?.template?.spec?.serviceAccountName!==RUNTIME)fail('RUN_RUNTIME_MISMATCH');
 if(!run.status?.conditions?.some(c=>c.type==='Ready'&&c.status==='True'))fail('RUN_NOT_READY');
 if((policy.bindings||[]).some(b=>(b.members||[]).some(m=>['allUsers','allAuthenticatedUsers'].includes(m))))fail('PUBLIC_IAM_BINDING');
}
function gcloud(args){
 try{return execFileSync('gcloud',[...args,'--project='+PROJECT],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000}).trim();}
 catch{fail('GCLOUD_READ_OR_AUTH_FAILED')}
}
async function http(url,options={}){
 try{
  const r=await fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(20000)});
  const text=await r.text();let body;try{body=JSON.parse(text)}catch{}
  return {status:r.status,body,headers:r.headers};
 }catch{fail('HTTP_CHECK_FAILED')}
}
export async function verifyClosed({mode='metadata',read=gcloud,request=http}={}){
 if(!['metadata','smoke'].includes(mode))fail('INVALID_VERIFY_MODE');
 const fn=JSON.parse(read(['functions','describe','digitalPassApi','--gen2','--region='+REGION,'--format=json']));
 const target=validateClosedFunction(fn);
 if(!target.buildServiceAccount){
  const build=/^projects\/(?:dns-core|387653285986)\/locations\/europe-west8\/builds\/([a-z0-9-]+)$/.exec(target.build);
  if(!build)fail('BUILD_IDENTITY_UNVERIFIED');
  target.buildServiceAccount=JSON.parse(read(['builds','describe',build[1],'--region='+REGION,'--format=json'])).serviceAccount||'';
 }
 const builder=target.buildServiceAccount.split('/').pop();
 if(!['387653285986-compute@developer.gserviceaccount.com','387653285986@cloudbuild.gserviceaccount.com'].includes(builder))fail('BUILD_IDENTITY_REVIEW_REQUIRED');
 const run=JSON.parse(read(['run','services','describe',target.service,'--region='+REGION,'--format=json']));
 const policy=JSON.parse(read(['run','services','get-iam-policy',target.service,'--region='+REGION,'--format=json']));
 validatePrivateService(run,policy);
 const projectPolicy=JSON.parse(read(['projects','get-iam-policy',PROJECT,'--format=json']));
 if((projectPolicy.bindings||[]).some(b=>(b.members||[]).some(m=>['allUsers','allAuthenticatedUsers'].includes(m))))fail('PROJECT_PUBLIC_BINDING_REVIEW_REQUIRED');
 const anonymous=await request(target.uri,{method:'GET'});
 if(![401,403].includes(anonymous.status))fail('ANONYMOUS_ACCESS_NOT_REJECTED');
 const result={mode,project:PROJECT,region:REGION,function:'digitalPassApi',service:target.service,runtime:RUNTIME,buildServiceAccount:target.buildServiceAccount,closed:true,anonymousRejected:true,authenticatedSmoke:false,cardAssociations:0};
 if(mode==='metadata')return result;
 // Metadata reads use the existing deploy credential; HTTP requests use a separate,
 // keyless verifier identity. Only getOpenIdToken on this fixed SA is needed.
 const accessToken=read(['auth','print-access-token']);
 const issued=await request(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${VERIFIER}:generateIdToken`,{method:'POST',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},body:JSON.stringify({audience:target.uri,includeEmail:true})});
 if(issued.status!==200||typeof issued.body?.token!=='string')fail('VERIFY_IDENTITY_TOKEN_UNAVAILABLE');
 const token=issued.body.token;
 let claims;try{claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString())}catch{fail('VERIFY_IDENTITY_TOKEN_INVALID')}
 if(claims.email!==VERIFIER||claims.aud!==target.uri||claims.exp*1000<=Date.now())fail('VERIFY_IDENTITY_MISMATCH');
 const base={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const wrong=await request(target.uri+'/v1/pass-activations/prepare',{method:'POST',headers:{...base,Origin:'https://unapproved.example'},body:'{}'});
 if(wrong.status!==403||wrong.body?.error!=='FORBIDDEN'||Object.keys(wrong.body).length!==1)fail('ORIGIN_BOUNDARY_FAILED');
 const preflight=await request(target.uri,{method:'OPTIONS',headers:{Authorization:base.Authorization,Origin:ORIGIN,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
 if(preflight.status!==204||preflight.headers.get('access-control-allow-origin')!==ORIGIN)fail('PREFLIGHT_FAILED');
 for(const path of ['/v1/pass-activations/prepare','/v1/pass-activations/claim','/v1/pass-registrations/complete']){
  const r=await request(target.uri+path,{method:'POST',headers:{...base,Origin:ORIGIN},body:'{}'});
  if(r.status!==503||r.body?.error!=='SERVICE_UNAVAILABLE'||Object.keys(r.body).length!==1)fail('OPERATIONAL_ROUTE_NOT_CLOSED');
  if(r.headers.get('access-control-allow-origin')!==ORIGIN||!r.headers.get('cache-control')?.includes('no-store'))fail('CLOSED_RESPONSE_HEADERS_FAILED');
 }
 return {...result,authenticatedSmoke:true,verifier:VERIFIER};
}
export async function inspectDeployAccess({read=gcloud,request=http}={}){
 const raw=JSON.parse(read(['builds','get-default-service-account','--region='+REGION,'--format=json']));
 const values=typeof raw==='string'?[raw]:Object.values(raw);
 const builder=values.filter(v=>typeof v==='string').map(v=>v.split('/').pop()).find(v=>['387653285986-compute@developer.gserviceaccount.com','387653285986@cloudbuild.gserviceaccount.com'].includes(v));
 if(!builder)fail('DEFAULT_BUILD_IDENTITY_REVIEW_REQUIRED');
 const accessToken=read(['auth','print-access-token']);
 const headers={Authorization:'Bearer '+accessToken,'Content-Type':'application/json'};
 const projectPermissions=['cloudfunctions.functions.get','cloudfunctions.functions.list','cloudfunctions.functions.create','cloudfunctions.functions.update','cloudfunctions.functions.generateUploadUrl','cloudfunctions.functions.sourceCodeSet','cloudfunctions.functions.setIamPolicy','cloudfunctions.operations.get'];
 const check=async(url,permissions,label)=>{
  const r=await request(url,{method:'POST',headers,body:JSON.stringify({permissions})});
  if(r.status!==200||(r.body?.permissions!==undefined&&!Array.isArray(r.body.permissions)))fail('PERMISSION_INSPECTION_UNAVAILABLE');
  return permissions.filter(p=>!(r.body?.permissions||[]).includes(p)).map(p=>label+':'+p);
 };
 const missing=await check('https://cloudresourcemanager.googleapis.com/v1/projects/dns-core:testIamPermissions',projectPermissions,'project');
 missing.push(...await check('https://iam.googleapis.com/v1/projects/dns-core/serviceAccounts/'+RUNTIME+':testIamPermissions',['iam.serviceAccounts.actAs'],'runtime'));
 // The legacy Google-owned builder cannot receive a direct user-managed policy.
 // For a modern default Compute builder, verify attachment permission up front.
 if(builder.endsWith('-compute@developer.gserviceaccount.com'))missing.push(...await check('https://iam.googleapis.com/v1/projects/dns-core/serviceAccounts/'+builder+':testIamPermissions',['iam.serviceAccounts.actAs'],'builder'));
 if(missing.length){const e=Error('DEPLOY_PERMISSION_PREFLIGHT_FAILED');e.missingPermissions=missing;throw e;}
 return {mode:'access',project:PROJECT,region:REGION,runtime:RUNTIME,defaultBuildServiceAccount:builder,requiredDeploymentPermissions:true,iamChanges:0};
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=='--mode'||args[2]!=='--report')fail('EXPLICIT_MODE_AND_REPORT_REQUIRED');
 const result=args[1]==='access'?await inspectDeployAccess():await verifyClosed({mode:args[1]});
 await mkdir(dirname(resolve(args[3])),{recursive:true});
 await writeFile(resolve(args[3]),JSON.stringify({...result,verifiedAt:new Date().toISOString()},null,2)+'\n');
 console.log(args[1]==='access'?'DEPLOY_PERMISSION_PREFLIGHT_PASSED':result.authenticatedSmoke?'CLOSED_SMOKE_PASSED; no cards associated. Temporary access revocation still required.':'PRIVATE_CLOSED_METADATA_PASSED; authenticated smoke still required.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
 // Do not print subprocess output, HTTP payloads, token values or stack traces.
 const code=/^[A-Z0-9_]+$/.test(error.message)?error.message:'VERIFY_CHECK_FAILED';
 if(Array.isArray(error.missingPermissions))console.error(error.missingPermissions.filter(p=>/^(project|runtime|builder):[a-zA-Z.]+$/.test(p)).join('\n'));
 console.error(code);process.exitCode=1;
});
