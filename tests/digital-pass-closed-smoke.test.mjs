import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyClosed,inspectDeployAccess,validateClosedFunction,validatePrivateService,RUNTIME,VERIFIER} from '../scripts/verify-digital-pass-closed.mjs';
const uri='https://digitalpassapi-example-oc.a.run.app';
const fn=()=>({name:'projects/dns-core/locations/europe-west8/functions/digitalPassApi',state:'ACTIVE',environment:'GEN_2',buildConfig:{serviceAccount:'projects/dns-core/serviceAccounts/387653285986-compute@developer.gserviceaccount.com'},serviceConfig:{serviceAccountEmail:RUNTIME,maxInstanceCount:1,service:'projects/dns-core/locations/europe-west8/services/digitalpassapi',uri,environmentVariables:{DNS_PASS_API_CLOSED:'true',DNS_PASS_PILOT_ENABLED:'false',DNS_PASS_POSSESSION_CLAIM_ENABLED:'false',DNS_PASS_REGISTRATION_ENABLED:'false',DNS_PASS_ALLOWED_ORIGINS:'https://dolomitinordicski.github.io'}}});
const run=()=>({metadata:{annotations:{}},spec:{template:{spec:{serviceAccountName:RUNTIME}}},status:{conditions:[{type:'Ready',status:'True'}]}});
test('deployment preflight reports project, runtime and builder permission gaps in one read-only pass',async()=>{
 const calls=[];
 const read=args=>args[0]==='builds'?JSON.stringify({serviceAccountEmail:'387653285986-compute@developer.gserviceaccount.com'}):'synthetic-access-token';
 const request=async(url,options)=>{calls.push({url,options});return {status:200,body:{}}};
 await assert.rejects(inspectDeployAccess({read,request}),error=>{
  assert.equal(error.message,'DEPLOY_PERMISSION_PREFLIGHT_FAILED');
  assert.ok(error.missingPermissions.includes('project:cloudfunctions.functions.generateUploadUrl'));
  assert.ok(error.missingPermissions.includes('runtime:iam.serviceAccounts.actAs'));
  assert.ok(error.missingPermissions.includes('builder:iam.serviceAccounts.actAs'));return true;
 });
 assert.equal(calls.length,3);assert.ok(calls.every(c=>c.url.endsWith(':testIamPermissions')));
});
test('deployment preflight records the actual builder when all required grants are effective',async()=>{
 const read=args=>args[0]==='builds'?JSON.stringify({serviceAccountEmail:'387653285986-compute@developer.gserviceaccount.com'}):'synthetic-access-token';
 const request=async(_url,options)=>({status:200,body:JSON.parse(options.body)});
 const result=await inspectDeployAccess({read,request});assert.equal(result.iamChanges,0);assert.equal(result.requiredDeploymentPermissions,true);
});
function fixture({functionData=fn(),service=run(),policy={bindings:[]},responseOverride,tokenEmail=VERIFIER}={}){
 const calls=[],commands=[];
 const read=args=>{commands.push(args);if(args[0]==='functions')return JSON.stringify(functionData);if(args[0]==='auth')return 'synthetic-access-token';return JSON.stringify(args[2]==='describe'?service:policy)};
 const request=async(url,options={})=>{
  calls.push({url,...options});
  if(responseOverride){const value=responseOverride(url,options);if(value)return value;}
  const headers=new Headers({'access-control-allow-origin':'https://dolomitinordicski.github.io','cache-control':'no-store'});
  if(url.startsWith('https://iamcredentials.googleapis.com/')){
   const token='synthetic.'+Buffer.from(JSON.stringify({email:tokenEmail,aud:uri,exp:Math.floor(Date.now()/1000)+600})).toString('base64url')+'.signature';
   return {status:200,body:{token},headers};
  }
  if(!options.headers?.Authorization)return {status:403,headers};
  if(options.headers.Origin==='https://unapproved.example')return {status:403,body:{error:'FORBIDDEN'},headers};
  if(options.method==='OPTIONS')return {status:204,headers};
  return {status:503,body:{error:'SERVICE_UNAVAILABLE'},headers};
 };
 return {read,request,calls,commands};
}
test('metadata-only verification does not issue tokens, deploy, change IAM or call operational routes',async()=>{
 const f=fixture(),r=await verifyClosed({...f,mode:'metadata'});
 assert.equal(r.authenticatedSmoke,false);assert.equal(r.cardAssociations,0);
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].method,'GET');
 assert.equal(f.commands.length,4);
 assert.ok(f.commands.every(a=>!a.includes('deploy')&&!a.includes('set-iam-policy')));
});
test('rejects drift to active flags, secret bindings, other runtime or untrusted endpoint before HTTP',async()=>{
 const cases=[x=>x.serviceConfig.environmentVariables.DNS_PASS_API_CLOSED='false',x=>x.serviceConfig.environmentVariables.DNS_PASS_REGISTRATION_ENABLED='true',x=>x.serviceConfig.secretEnvironmentVariables=[{key:'SECRET'}],x=>x.serviceConfig.serviceAccountEmail='other',x=>x.serviceConfig.uri='https://unapproved.example',x=>x.serviceConfig.maxInstanceCount=10];
 for(const mutate of cases){const value=fn();mutate(value);const f=fixture({functionData:value});await assert.rejects(verifyClosed(f));assert.equal(f.calls.length,0);}
});
test('rejects public IAM, disabled invoker check and anonymous access despite empty direct policy',async()=>{
 assert.throws(()=>validatePrivateService(run(),{bindings:[{members:['allUsers']}]}),/PUBLIC_IAM_BINDING/);
 const service=run();service.metadata.annotations['run.googleapis.com/invoker-iam-disabled']='true';
 assert.throws(()=>validatePrivateService(service,{bindings:[]}),/INVOKER_IAM_CHECK_DISABLED/);
 const f=fixture({responseOverride:(_u,o)=>!o.headers?.Authorization?{status:503}:undefined});
 await assert.rejects(verifyClosed(f),/ANONYMOUS_ACCESS_NOT_REJECTED/);
});
test('unknown or missing build identities stop before any HTTP probe',async()=>{
 for(const buildConfig of [{},{serviceAccount:RUNTIME}]){
  const value=fn();value.buildConfig=buildConfig;const f=fixture({functionData:value});
  await assert.rejects(verifyClosed(f),/BUILD_IDENTITY/);assert.equal(f.calls.length,0);
 }
});
test('public project bindings cannot be hidden by an empty service policy',async()=>{
 const f=fixture(),original=f.read;
 f.read=args=>args[0]==='projects'?JSON.stringify({bindings:[{role:'roles/run.invoker',members:['allAuthenticatedUsers']}]}):original(args);
 await assert.rejects(verifyClosed(f),/PROJECT_PUBLIC_BINDING_REVIEW_REQUIRED/);assert.equal(f.calls.length,0);
});
test('closed authenticated smoke uses the separate verifier and sends no real card or holder data',async()=>{
 const f=fixture(),r=await verifyClosed({...f,mode:'smoke'});
 assert.equal(r.authenticatedSmoke,true);assert.equal(r.verifier,VERIFIER);assert.equal(r.cardAssociations,0);
 const issuance=f.calls.find(c=>c.url.includes('generateIdToken'));
 assert.deepEqual(JSON.parse(issuance.body),{audience:uri,includeEmail:true});
 assert.ok(f.calls.filter(c=>c.url.startsWith(uri)&&c.method==='POST').every(c=>c.body==='{}'));
});
test('missing invoker is distinguished from a real application origin rejection',async()=>{
 const f=fixture({responseOverride:(u,o)=>u.startsWith(uri)&&o.headers?.Authorization?{status:403,body:undefined}:undefined});
 await assert.rejects(verifyClosed({...f,mode:'smoke'}),/ORIGIN_BOUNDARY_FAILED/);
});
test('rejects a token for the deployer and closed responses containing personal fields',async()=>{
 const wrong=fixture({tokenEmail:'deployer@example.test'});
 await assert.rejects(verifyClosed({...wrong,mode:'smoke'}),/VERIFY_IDENTITY_MISMATCH/);
 const leak=fixture({responseOverride:(u,o)=>u.endsWith('/claim')?{status:503,body:{error:'SERVICE_UNAVAILABLE',email:'holder@example.test'}}:undefined});
 await assert.rejects(verifyClosed({...leak,mode:'smoke'}),/OPERATIONAL_ROUTE_NOT_CLOSED/);
});
test('smoke workflow cannot deploy and activation requires its own approval',()=>{
 const flow=readFileSync('.github/workflows/deploy-digital-pass-pilot.yml','utf8');
 const smoke=flow.split('\n  smoke:\n')[1];assert.ok(smoke);
 assert.match(smoke,/DNS_PASS_VERIFY_APPROVED/);assert.match(smoke,/--mode smoke/);
 assert.doesNotMatch(smoke,/firebase.js deploy|add-iam-policy-binding|secrets versions access/);
 assert.match(flow,/inputs.phase != 'smoke'/);assert.match(flow,/DNS_PASS_ACTIVATE_APPROVED/);
});
