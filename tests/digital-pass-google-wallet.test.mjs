import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { signGoogleWalletSaveUrl, getGoogleWalletLink } from '../server/digital-pass-google-wallet.mjs';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: {type:'spki',format:'pem'}, privateKeyEncoding: {type:'pkcs8',format:'pem'} });
const presentation={credentialId:'a'.repeat(64),serial:'019621',holderName:'Example',validFrom:new Date(1790000000000).toISOString(),validUntil:new Date(1800000000000).toISOString(),barcodeUrl:'https://pass.dolomitinordicski.com/v/'+'b'.repeat(43)};
test('Google Save JWT is correctly RS256 signed with QR URL and issuer',()=>{
 const url=signGoogleWalletSaveUrl({presentation,issuerId:'123456789',serviceAccount:{client_email:'issuer@example.iam.gserviceaccount.com',private_key:privateKey},origins:['https://dolomitinordicski.github.io']});
 assert.ok(url.startsWith('https://pay.google.com/gp/v/save/'));
 const jwt=url.split('/').pop(); const [header,body,sig]=jwt.split('.');
 const verify=createVerify('RSA-SHA256'); verify.update(header+'.'+body); verify.end();
 assert.equal(verify.verify(publicKey,Buffer.from(sig,'base64url')),true);
 const payload=JSON.parse(Buffer.from(body,'base64url').toString());
 assert.equal(payload.payload.genericObjects[0].barcode.value,presentation.barcodeUrl);
 assert.equal(payload.payload.genericObjects[0].id,'123456789.'+'a'.repeat(64));
 assert.ok(!url.includes('PRIVATE KEY'));
});
test('Google link is unavailable without issuer config or verified holder',async()=>{
 await assert.rejects(getGoogleWalletLink({db:{},identity:{uid:'test',email_verified:true},physicalPassId:'p'}),/GOOGLE_WALLET_NOT_CONFIGURED/);
 await assert.rejects(getGoogleWalletLink({db:{},identity:{uid:'test',email_verified:false},physicalPassId:'p'}),/UNAUTHORIZED/);
});
