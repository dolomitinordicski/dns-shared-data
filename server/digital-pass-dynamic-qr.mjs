import {randomBytes,createHash} from 'node:crypto';
import {transientRetention} from './digital-pass-retention.mjs';
export const PRESENTATION_TTL_MS=90000;
const hash=value=>createHash('sha256').update(value).digest('hex');
/** Short-lived bearer presentation. No identity or card number is encoded in the QR. */
export async function issueDynamicQr({db,identity,physicalPassId,now=Date.now()}) {
 if(!identity?.uid||identity.email_verified!==true)throw Error('UNAUTHORIZED');
 const token=randomBytes(32).toString('base64url'),id=hash(token);
 return db.runTransaction(async tx=>{
  const r=await tx.get(db.collection('passRegistrations').doc(physicalPassId));
  if(!r.exists||r.data().holderUid!==identity.uid||r.data().status!=='ACTIVE')throw Error('NOT_FOUND');
  const c=await tx.get(db.collection('digitalCredentials').doc(r.data().credentialId));
  if(!c.exists||c.data().holderUid!==identity.uid||c.data().status!=='ACTIVE'||c.data().physicalPassId!==physicalPassId)throw Error('NOT_FOUND');
  const expiresAt=now+PRESENTATION_TTL_MS;
  tx.create(db.collection('passQrPresentations').doc(id),{credentialId:r.data().credentialId,issuedAt:now,expiresAt,...transientRetention(expiresAt)});
  return {qrPayload:'dns-pass:v2:'+token,qrExpiresAt:expiresAt};
 });
}
export async function resolveDynamicQr({db,token,now=Date.now()}) {
 if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
 const p=await db.collection('passQrPresentations').doc(hash(token)).get();
 if(!p.exists)return null;
 const v=p.data();
 if(!Number.isFinite(v.issuedAt)||!Number.isFinite(v.expiresAt)||v.issuedAt>now||v.expiresAt<=now||v.expiresAt-v.issuedAt>PRESENTATION_TTL_MS||!/^[a-f0-9]{64}$/.test(v.credentialId||''))return null;
 return v.credentialId;
}
