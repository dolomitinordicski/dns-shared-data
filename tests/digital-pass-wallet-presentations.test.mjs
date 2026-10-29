import test from 'node:test';
import assert from 'node:assert/strict';
import { createWalletPresentation, applePassFields, googleGenericObject } from '../server/digital-pass-wallet-presentations.mjs';
const credentialId='a'.repeat(64),qrToken='b'.repeat(43);
const credential={status:'ACTIVE',seasonId:'2026-27',productCode:'sk-dns',printedNumber:'019621',validFrom:1794697200000,validUntil:1806530400000};
const args={credentialId,credential,holderName:'Example Person',qrToken,verificationBase:'https://pass.dolomitinordicski.com/'};
test('Apple and Google share same HTTPS scan URL',()=>{
 const p=createWalletPresentation(args);
 const apple=applePassFields(p),google=googleGenericObject(p,{issuerId:'123456789'});
 assert.equal(apple.barcodes[0].message,google.barcode.value);
 assert.equal(google.id,'123456789.'+credentialId);
 assert.equal(apple.generic.auxiliaryFields[0].value,'019621');
 assert.equal(p.barcodeUrl,'https://pass.dolomitinordicski.com/v/'+qrToken);
});
test('rejects unapproved formats, wrong season and arbitrary QR hosts',()=>{
 for(const change of [{status:'REVOKED'},{seasonId:'2025-26'},{productCode:'sk-area'}]){
  assert.throws(()=>createWalletPresentation({...args,credential:{...credential,...change}}),/WALLET_PASS_NOT_ELIGIBLE/);
 }
 assert.throws(()=>createWalletPresentation({...args,verificationBase:'https://example.com/'}),/INVALID_VERIFICATION_BASE/);
 assert.throws(()=>createWalletPresentation({...args,qrToken:'019621'}),/INVALID_QR_TOKEN/);
 assert.throws(()=>googleGenericObject(createWalletPresentation(args),{}),/GOOGLE_ISSUER_NOT_CONFIGURED/);
});
