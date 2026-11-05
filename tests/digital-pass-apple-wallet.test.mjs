import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareAppleWalletPass } from '../server/digital-pass-apple-wallet.mjs';
test('Apple Wallet preparation is unavailable without signable configuration or verified holder', async()=>{
  await assert.rejects(prepareAppleWalletPass({db:{},identity:{uid:'u',email_verified:true},physicalPassId:'x'}),/APPLE_WALLET_NOT_CONFIGURED/);
  await assert.rejects(prepareAppleWalletPass({db:{},identity:{uid:'u',email_verified:false},physicalPassId:'x',verificationBase:'https:\/\/pass.dolomitinordicski.com/'}),/UNAUTHORIZED/);
});
test('Apple Wallet preparation requires matching active registration',async()=>{
 const db={collection:()=>({doc:()=>({get:async()=>({exists:false})})})};
 await assert.rejects(prepareAppleWalletPass({db,identity:{uid:'u',email_verified:true},physicalPassId:'x',verificationBase:'https://pass.dolomitinordicski.com/'}),/NOT_FOUND/);
});
