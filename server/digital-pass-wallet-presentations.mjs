import { getDigitalPassProduct } from './digital-pass-product-registry.mjs';

/** Pure Wallet presentation adapters: NO pass issuance, keys, service accounts or outbound API calls.
 * Inputs are server-owned credential records, never browser-submitted identity fields.
 * Issuers must sign Apple .pkpass and Google Save JWT in separate, authenticated services.
 */
const locale = value => ({ defaultValue: { language: 'de-DE', value } });
function check({ credentialId, credential, holderName, verificationBase }) {
  const definition = getDigitalPassProduct(credential?.productCode, credential?.seasonId);
  if (typeof credentialId !== 'string' || !/^[a-f0-9]{64}$/.test(credentialId) ||
    credential?.status !== 'ACTIVE' || !definition ||
    credential?.passDesign != null && credential.passDesign !== definition.passDesign ||
    !/^\\d{6}$/.test(credential.printedNumber || '') ||
    typeof holderName !== 'string' || !holderName.trim() || holderName.length > 201 ||
    !Number.isFinite(credential.validFrom) || !Number.isFinite(credential.validUntil) ||
    credential.validFrom >= credential.validUntil)
    throw new Error('WALLET_PASS_NOT_ELIGIBLE');
  const base = new URL(verificationBase);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash ||
      base.pathname !== '/' || !base.hostname.endsWith('.dolomitinordicski.com'))
    throw new Error('INVALID_VERIFICATION_BASE');
  return definition;
}
export function createWalletPresentation({ credentialId, credential, holderName, qrToken, verificationBase }) {
  const definition = check({ credentialId, credential, holderName, verificationBase });
  if (typeof qrToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(qrToken)) throw new Error('INVALID_QR_TOKEN');
  const barcodeUrl = new URL('v/' + qrToken, verificationBase).toString();
  return Object.freeze({
    credentialId, serial: credential.printedNumber, holderName: holderName.trim(),
    productCode: definition.productCode, passDesign: definition.passDesign,
    walletMetadata: { ...definition.wallet },
    validFrom: new Date(credential.validFrom).toISOString(),
    validUntil: new Date(credential.validUntil).toISOString(),
    barcodeUrl
  });
}
export function applePassFields(presentation) {
  const wallet = presentation.walletMetadata;
  return {
    formatVersion: 1,
    organizationName: 'Dolomiti NordicSki',
    description: wallet.description,
    logoText: wallet.logoText,
    ...(wallet.foregroundColor ? { foregroundColor: wallet.foregroundColor } : {}),
    ...(wallet.backgroundColor ? { backgroundColor: wallet.backgroundColor } : {}),
    expirationDate: presentation.validUntil,
    barcodes: [{ format:'PKBarcodeFormatQR', message:presentation.barcodeUrl, messageEncoding:'iso-8859-1' }],
    generic: {
      primaryFields: [{ key:'pass', label:wallet.primaryLabel, value:'2026/27' }],
      secondaryFields: [{ key:'holder', label:'NAME', value:presentation.holderName }],
      auxiliaryFields: [{ key:'number', label:'KARTENNUMMER', value:presentation.serial }]
    }
    // passTypeIdentifier, teamIdentifier, serialNumber and signature must be
    // applied exclusively by the authenticated Apple issuer.
  };
}
export function googleGenericObject(presentation, { issuerId, classSuffix } = {}) {
  const wallet = presentation.walletMetadata;
  classSuffix ??= wallet.classSuffix;
  if (typeof issuerId !== 'string' || !/^\\d{6,20}$/.test(issuerId) ||
    !/^[a-zA-Z0-9._-]{1,64}$/.test(classSuffix)) throw new Error('GOOGLE_ISSUER_NOT_CONFIGURED');
  return {
    id: issuerId + '.' + presentation.credentialId,
    classId: issuerId + '.' + classSuffix,
    state: 'ACTIVE',
    cardTitle: locale(wallet.cardTitle),
    header: locale(wallet.header),
    subheader: locale(presentation.holderName),
    barcode: { type:'QR_CODE', value:presentation.barcodeUrl },
    textModulesData: [{ id:'pass-type', header:'Pass', body:wallet.passTypeLabel },
      { id:'pass-number', header:'Kartennummer', body:presentation.serial }],
    ...(wallet.hexBackgroundColor ? { hexBackgroundColor: wallet.hexBackgroundColor } : {})
    // Google Wallet issuer must create/approve the Class and sign the save JWT.
  };
}
