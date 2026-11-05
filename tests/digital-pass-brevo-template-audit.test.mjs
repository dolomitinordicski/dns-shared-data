import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectBrevoDoiTemplates} from '../server/digital-pass-brevo-template-audit.mjs';
const mock=html=>async()=>({ok:true,json:async()=>({isActive:true,htmlContent:html})});
test('template 9 alone does not certify all languages or live DOI from metadata',async()=>{
 const result=await inspectBrevoDoiTemplates({apiKey:'fake',templateIds:{it:9},fetchImpl:mock('<a href="{{ optin }}">Confirm</a>')});
 assert.equal(result.templates.it.compatible,true);assert.equal(result.templates.it.liveDoiVerified,false);
 assert.equal(result.compatible,false);assert.deepEqual(result.missingLanguages,['de','en']);
});
test('missing optin tag fails compatibility even for active template',async()=>{
 const r=await inspectBrevoDoiTemplates({apiKey:'fake',templateIds:{it:9},fetchImpl:mock('No DOI link')});assert.equal(r.templates.it.compatible,false);
});
test('no implicit template IDs, and lookup failures remain fail closed',async()=>{
 await assert.rejects(inspectBrevoDoiTemplates({apiKey:'fake'}),/NOT_APPROVED/);
 await assert.rejects(inspectBrevoDoiTemplates({apiKey:'fake',templateIds:{it:2},fetchImpl:mock('')}),/NOT_APPROVED/);
 await assert.rejects(inspectBrevoDoiTemplates({apiKey:'fake',templateIds:{it:9},fetchImpl:async()=>({ok:false})}),/LOOKUP_FAILED/);
});
