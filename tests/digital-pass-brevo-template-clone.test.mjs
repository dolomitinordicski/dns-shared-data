import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptHtml,cloneDoiTemplates} from '../scripts/clone-digital-pass-doi-templates.mjs';
test('replaces only the agency legacy DOI variable',()=>{
 const input='<html><a href="{{ doubleoptin }}">OK</a><p>Agency artwork</p></html>';
 const out=adaptHtml(input);
 assert.match(out,/\{\{ params.DOIurl \}\}/);
 assert.ok(out.includes('Agency artwork'));
 assert.ok(!out.includes('{{ doubleoptin }}'));
});
test('refuses source templates without exactly one DOI button',()=>{
 assert.throws(()=>adaptHtml('<a href="/welcome">No DOI</a>'),/UNEXPECTED_DOI_TAG_COUNT/);
 assert.throws(()=>adaptHtml('<a>{{ doubleoptin }}</a><b>{{ doubleoptin }}</b>'),/UNEXPECTED_DOI_TAG_COUNT/);
});
test('dry run fetches only and never writes',async()=>{
 const calls=[];
 const result=await cloneDoiTemplates({apiKey:'test',fetchImpl:async(url,opt)=>{
  calls.push({url,method:opt.method||'GET'});
  if(url.includes('?limit='))return {ok:true,json:async()=>({templates:[]})};
  const id=Number(url.split('/').at(-1));
  return {ok:true,json:async()=>({id,name:'Agency',sender:{email:'welcome@dolomitinordicski.com',name:'DNS'},
   subject:'Confirm',htmlContent:'<a href="{{ doubleoptin }}">Confirm</a>'})};
 }});
 assert.equal(result.length,3);
 assert.deepEqual(calls.map(x=>x.method),['GET','GET','GET','GET']);
 assert.equal(result[0].action,'DRY_RUN');
});
test('apply creates inactive clones and verifies new IDs',async()=>{
 const calls=[];let next=100;
 const result=await cloneDoiTemplates({apiKey:'test',apply:true,fetchImpl:async(url,opt)=>{
  const method=opt.method||'GET';calls.push(method);
  if(url.includes('?limit='))return {ok:true,json:async()=>({templates:[]})};
  if(method==='POST') {
   const body=JSON.parse(opt.body);
   assert.equal(body.isActive,false);
   assert.match(body.htmlContent,/\{\{ params.DOIurl \}\}/);
   assert.equal(body.sender.email,'welcome@dolomitinordicski.com');
   return {ok:true,json:async()=>({id:++next})};
  }
  const id=Number(url.split('/').at(-1));
  if(id>=100)return {ok:true,json:async()=>({id,isActive:false,doiTemplate:true,htmlContent:'{{ params.DOIurl }}'})};
  return {ok:true,json:async()=>({id,name:'Agency',sender:{email:'welcome@dolomitinordicski.com'},
   subject:'Confirm',htmlContent:'<a href="{{ doubleoptin }}">Confirm</a>'})};
 }});
 assert.deepEqual(result.map(x=>x.newId),[101,102,103]);
 assert.equal(calls.filter(x=>x==='POST').length,3);
});

test('existing inactive clone is reused instead of duplicated',async()=>{
 let writes=0;
 const names=['DNS Digital Pass DOI – IT','DNS Digital Pass DOI – DE','DNS Digital Pass DOI – EN'];
 const result=await cloneDoiTemplates({apiKey:'test',apply:true,fetchImpl:async(url,opts)=>{
  if(url.includes('?limit='))return {ok:true,json:async()=>({templates:names.map((name,i)=>({id:i+9,name}))})};
  if(opts.method==='POST'){writes++;throw Error('unexpected create');}
  const id=Number(url.split('/').at(-1));
  if(id>=9)return {ok:true,json:async()=>({id,name:names[id-9],subject:'Confirm',isActive:false,
   doiTemplate:false,htmlContent:'<a href="{{ params.DOIurl }}">Confirm</a>'})};
  return {ok:true,json:async()=>({id,name:'Agency',subject:'Confirm',
   sender:{email:'welcome@dolomitinordicski.com'},
   htmlContent:'<a href="{{ doubleoptin }}">Confirm</a>'})};
 }});
 assert.equal(writes,0);
 assert.deepEqual(result.map(x=>x.action),['REUSE_EXISTING','REUSE_EXISTING','REUSE_EXISTING']);
 assert.equal(result.every(x=>x.readyForDoi===false),true);
});
