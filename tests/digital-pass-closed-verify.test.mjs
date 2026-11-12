import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyClosed, RUNTIME } from '../scripts/verify-digital-pass-closed.mjs';

const functionDescription={
  name:'projects/dns-core/locations/europe-west8/functions/digitalPassApi',
  state:'ACTIVE',
  environment:'GEN_2',
  serviceConfig:{
    serviceAccountEmail:RUNTIME,
    maxInstanceCount:1,
    secretEnvironmentVariables:[],
    secretVolumes:[],
    environmentVariables:{
      DNS_PASS_API_CLOSED:'true',
      DNS_PASS_PILOT_ENABLED:'false',
      DNS_PASS_POSSESSION_CLAIM_ENABLED:'false',
      DNS_PASS_REGISTRATION_ENABLED:'false',
      DNS_PASS_ALLOWED_ORIGINS:'https://dolomitinordicski.github.io',
    },
    uri:'https://digitalpassapi-3kkrgcggia-oc.a.run.app/',
    service:'projects/dns-core/locations/europe-west8/services/digitalpassapi',
  },
  buildConfig:{serviceAccount:'projects/dns-core/serviceAccounts/387653285986-compute@developer.gserviceaccount.com'},
};
const runDescription={
  metadata:{annotations:{}},
  spec:{template:{spec:{serviceAccountName:RUNTIME}}},
  status:{conditions:[{type:'Ready',status:'True'}]},
};
function dependencies(status){
  const read=args=>{
    if(args[0]==='functions')return JSON.stringify(functionDescription);
    if(args[0]==='run'&&args[1]==='services'&&args[2]==='describe')return JSON.stringify(runDescription);
    if(args[0]==='run'&&args[1]==='services'&&args[2]==='get-iam-policy')return JSON.stringify({bindings:[]});
    if(args[0]==='projects'&&args[1]==='get-iam-policy')return JSON.stringify({bindings:[]});
    throw new Error('Unexpected read-only command');
  };
  const request=async()=>({status,body:{privateResponse:'must-not-be-logged'},headers:new Headers()});
  return {read,request};
}

for(const status of [401,403]){
  test(`closed metadata accepts anonymous HTTP ${status} and records only the status`,async()=>{
    const result=await verifyClosed({mode:'metadata',...dependencies(status)});
    assert.equal(result.anonymousRejected,true);
    assert.equal(result.anonymousStatus,status);
    assert.equal(result.authenticatedSmoke,false);
  });
}
for(const status of [0,200,302,404,500]){
  test(`closed metadata rejects anonymous HTTP ${status} and reports no response body`,async()=>{
    await assert.rejects(
      verifyClosed({mode:'metadata',...dependencies(status)}),
      error=>{
        assert.equal(error.message,`ANONYMOUS_ACCESS_NOT_REJECTED_HTTP_${status}`);
        assert.doesNotMatch(error.message,/privateResponse/);
        return true;
      },
    );
  });
}
