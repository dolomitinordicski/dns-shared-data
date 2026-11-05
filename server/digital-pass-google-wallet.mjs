import { createSign } from 'node:crypto';
import { createWalletPresentation, googleGenericObject } from './digital-pass-wallet-presentations.mjs';

// Sign server-side only. Never expose private keys in responses, browser bundles or logs.
// Requires a Google Wallet issuer with a pre-created, approved Generic Class.
export function signGoogleWalletSaveUrl({ presentation, issuerId, serviceAccount, origins = [] }) {
  if (!serviceAccount || typeof serviceAccount.client_email !== 'string' ||
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.gserviceaccount\.com$/.test(serviceAccount.client_email) ||
      typeof serviceAccount.private_key !== 'string' || !serviceAccount.private_key.includes('BEGIN PRIVATE KEY') ||
      !Array.isArray(origins) || !origins.every(s => typeof s === 'string' && /^https:\/\//.test(s)))
    throw new Error('GOOGLE_WALLET_NOT_CONFIGURED');
  const object = googleGenericObject(presentation, { issuerId });
  const b64 = v => Buffer.from(JSON.stringify(v)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = { iss: serviceAccount.client_email, aud: 'google', typ: 'savetowallet',
    iat: now, exp: now + 300, origins, payload: { genericObjects: [object] } };
  const unsigned = b64(header) + '.' + b64(claims);
  const signer = createSign('RSA-SHA256'); signer.update(unsigned); signer.end();
  const signature = signer.sign(serviceAccount.private_key, 'base64url');
  return 'https://pay.google.com/gp/v/save/' + unsigned + '.' + signature;
}

export async function getGoogleWalletLink({ db, identity, physicalPassId, walletIssuerId,
  walletSigningJson, verificationBase, walletOrigins }) {
  if (!identity?.uid || identity.email_verified !== true ||
      typeof physicalPassId !== 'string' || !physicalPassId) throw new Error('UNAUTHORIZED');
  if (!walletIssuerId || !walletSigningJson || !verificationBase)
    throw new Error('GOOGLE_WALLET_NOT_CONFIGURED');
  const registration = await db.collection('passRegistrations').doc(physicalPassId).get();
  if (!registration.exists || registration.data().holderUid !== identity.uid ||
      registration.data().status !== 'ACTIVE') throw new Error('NOT_FOUND');
  const credentialId = registration.data().credentialId;
  const [credential, payload, holder] = await Promise.all([
    db.collection('digitalCredentials').doc(credentialId).get(),
    db.collection('passCredentialPayloads').doc(credentialId).get(),
    db.collection('passHolders').doc(identity.uid).get()
  ]);
  if (!credential.exists || !payload.exists || !holder.exists ||
      credential.data().holderUid !== identity.uid ||
      payload.data().holderUid !== identity.uid ||
      credential.data().status !== 'ACTIVE' ||
      Date.now() >= credential.data().validUntil) throw new Error('NOT_FOUND');
  const h = holder.data();
  const presentation = createWalletPresentation({ credentialId, credential: credential.data(),
    holderName: h.givenName + ' ' + h.familyName, qrToken: payload.data().token, verificationBase });
  let serviceAccount;
  try { serviceAccount = JSON.parse(walletSigningJson); }
  catch { throw new Error('GOOGLE_WALLET_NOT_CONFIGURED'); }
  return { saveUrl: signGoogleWalletSaveUrl({ presentation, issuerId: walletIssuerId,
    serviceAccount, origins: walletOrigins }) };
}
