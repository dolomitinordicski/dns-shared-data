import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {decodeRenderedQr} from '../helpers/digital-pass-rendered-qr.mjs';
const require=createRequire(process.env.DNS_E2E_DEPS_ROOT?resolve(process.env.DNS_E2E_DEPS_ROOT,'package.json'):new URL('../../tools/digital-pass-e2e/package.json',import.meta.url));
const QRCode=require('qrcode'),{PNG}=require('pngjs');
const fixture=JSON.parse(readFileSync(new URL('../fixtures/digital-pass-qr-main-94fcd1e.json',import.meta.url),'utf8'));
test('the exact failed main PNG decodes to its original synthetic payload, 32 times',()=>{
 const image=Buffer.from(fixture.pngBase64,'base64');
 assert.equal(createHash('sha256').update(image).digest('hex'),fixture.sha256);
 for(let i=0;i<32;i++)assert.equal(decodeRenderedQr(image),fixture.expectedPayload);
});
test('1024 deterministic payload/mask combinations decode at the unchanged 420px renderer settings',async()=>{
 for(let i=0;i<128;i++){
  const token=createHash('sha256').update('DNS C1 reproducible sample '+i).digest('base64url');
  const prefixes=[fixture.expectedPayload.replace(/[^/]+$/,''),'http://127.0.0.1:5101/demo-dns-pass-staging-c1/europe-west8/digitalPassApi/v/','https://europe-west8-dns-pass-staging-c1.cloudfunctions.net/digitalPassApi/v/'];
  const payload=prefixes[i%prefixes.length]+token;
  for(let maskPattern=0;maskPattern<8;maskPattern++){
   const image=await QRCode.toBuffer(payload,{width:420,margin:4,maskPattern});
   assert.equal(decodeRenderedQr(image),payload,`sample ${i}, mask ${maskPattern}`);
  }
 }
});
test('a blank PNG is rejected rather than returning an expected/cached payload',()=>{
 const png=new PNG({width:420,height:420});png.data.fill(255);
 assert.throws(()=>decodeRenderedQr(PNG.sync.write(png)));
});
