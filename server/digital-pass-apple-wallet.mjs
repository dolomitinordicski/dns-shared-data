/** Apple Wallet signing is isolated from the public API and never active without DNS certificates.
 * Produces pass metadata only. The authenticated .pkpass issuer must supply icon/logo images,
 * passTypeIdentifier, teamIdentifier, serialNumber and a valid PKCS#7 signature.
 */
import { applePassFields, createWalletPresentation } from './digital-pass-wallet-presentations.mjs';

export async function prepareAppleWalletPass({db, identity, physicalPassId, verificationBase}) {
  if (!identity?.uid || identity.email_verified !== true || !physicalPassId) throw new Error('UNAUTHORIZED');
  if (!verificationBase) throw new Error('APPLE_WALLET_NOT_CONFIGURED');
  const registration = await db.collection('passRegistrations').doc(physicalPassId).get();
  if (!registration.exists || registration.data().holderUid !== identity.uid || registration.data().status !== 'ACTIVE')
    throw new Error('NOT_FOUND');
  const credentialId = registration.data().credentialId;
  const [credential,payload,holder] = await Promise.all([
    db.collection('digitalCredentials').doc(credentialId).get(),
    db.collection('passCredentialPayloads').doc(credentialId).get(),
    db.collection('passHolders').doc(identity.uid).get()
  ]);
  if (!credential.exists || !payload.exists || !holder.exists ||
      credential.data().holderUid !== identity.uid || payload.data().holderUid !== identity.uid ||
      credential.data().status !== 'ACTIVE' || Date.now() >= credential.data().validUntil) throw new Error('NOT_FOUND');
  const h=holder.data();
  const presentation=createWalletPresentation({credentialId,credential:credential.data(),
    holderName:h.givenName+' '+h.familyName,qrToken:payload.data().token,verificationBase});
  return { fields:applePassFields(presentation), serialNumber:presentation.credentialId };
}
