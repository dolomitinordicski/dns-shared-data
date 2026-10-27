import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectBrevoDoiTemplates } from '../server/digital-pass-brevo-template-audit.mjs';
const mock = ({isActive=true,doiTemplate=true,htmlContent='<a href="{{ params.DOIurl }}">Confirm</a>'}={}) =>
 async () => ({ok:true,json:async()=>({isActive,doiTemplate,htmlContent})});
test('all three agency templates must have DOI URL, active flag and DOI flag',async()=>{
 const result=await inspectBrevoDoiTemplates({apiKey:'fake',fetchImpl:mock()});
 assert.equal(result.compatible,true);
 assert.deepEqual(Object.keys(result.templates).sort(),['de','en','it']);
});
test('reject active template that lacks DOIurl variable',async()=>{
 const result=await inspectBrevoDoiTemplates({apiKey:'fake',fetchImpl:mock({htmlContent:'No DOI link'})});
 assert.equal(result.compatible,false);
});
test('lookup failure blocks rollout',async()=>{
 await assert.rejects(inspectBrevoDoiTemplates({apiKey:'fake',fetchImpl:async()=>({ok:false,status:403})}),/BREVO_TEMPLATE_LOOKUP_FAILED/);
});
