import { isDigitalPassProduct } from './digital-pass-inventory-resolver.mjs';

/** Pure Wallet presentation adapters: NO pass issuance, keys, service accounts or outbound API calls.
 * Inputs are server-owned credential records, never browser-submitted identity fields.
 * Issuers must sign Apple .pkpass and Google Save JWT in separate, authenticated services.
 */
const locale = (value) => ({ defaultValue: { language: 'de-DE', value } });
function check({ credentialId, credential, holderName, verificationBase }) {
  if (typeof credentialId !== 'string' || !/^[a-f0-9]{64}$/.test(credentialId) ||
    credential?.status !== 'ACTIVE' || credential?.seasonId !== '2026-27' ||
    !isDigitalPassProduct(credential?.productCode) ||
    !/^\d{6}$/.test(credential.printedNumber || '') ||
    typeof holderName !== 'string' || !holderName.trim() || holderName.length > 201 ||
    !Number.isFinite(credential.validFrom) || !Number.isFinite(credential.validUntil) ||
    credential.validFrom >= credential.validUntil)
    throw new Error('WALLET_PASS_NOT_ELIGIBLE');
  const base = new URL(verificationBase);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash ||
      base.pathname !== '/' || !base.hostname.endsWith('.dolomitinordicski.com'))
    throw new Error('INVALID_VERIFICATION_BASE');
}
export function createWalletPresentation({ credentialId, credential, holderName, qrToken, verificationBase }) {
  check({ credentialId, credential, holderName, verificationBase });
  if (typeof qrToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(qrToken)) throw new Error('INVALID_QR_TOKEN');
  const barcodeUrl = new URL('v/' + qrToken, verificationBase).toString();
  return Object.freeze({
    credentialId, serial: credential.printedNumber, holderName: holderName.trim(), productCode: credential.productCode,
    validFrom: new Date(credential.validFrom).toISOString(),
    validUntil: new Date(credential.validUntil).toISOString(),
    barcodeUrl
  });
}
export function applePassFields(presentation) {
  return {
    formatVersion: 1,
    organizationName: 'Dolomiti NordicSki',
    description: presentation.productCode === 'sk-instructor' ? 'DNS Ski Instructor Pass 2026/27' : 'DNS Saisonkarte 2026/27',
    logoText: presentation.productCode === 'sk-instructor' ? 'DNS LANGAUFLEHRER' : 'Dolomiti NordicSki',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: presentation.productCode === 'sk-instructor' ? 'rgb(27, 73, 75)' : 'rgb(13, 77, 94)',
    expirationDate: presentation.validUntil,
    barcodes: [{ format:'PKBarcodeFormatQR', message:presentation.barcodeUrl, messageEncoding:'iso-8859-1' }],
    generic: {
      primaryFields: [{ key:'pass', label: presentation.productCode === 'sk-instructor' ? 'LANGAUFLEHRER · MAESTRO DI SCI' : 'SAISONKARTE DNS', value:'2026/27' }],
      secondaryFields: [{ key:'holder', label:'NAME', value:presentation.holderName }],
      auxiliaryFields: [{ key:'number', label:'KARTENNUMMER', value:presentation.serial }]
    }
    // passTypeIdentifier, teamIdentifier, serialNumber and signature must be
    // applied exclusively by the authenticated Apple issuer.
  };
}
export function googleGenericObject(presentation, { issuerId, classSuffix } = {}) {
  classSuffix ??= presentation.productCode === 'sk-instructor' ? 'dns-ski-instructor-2026-27' : 'dns-season-2026-27';
  if (typeof issuerId !== 'string' || !/^\d{6,20}$/.test(issuerId) ||
    !/^[a-zA-Z0-9._-]{1,64}$/.test(classSuffix)) throw new Error('GOOGLE_ISSUER_NOT_CONFIGURED');
  return {
    id: issuerId + '.' + presentation.credentialId,
    classId: issuerId + '.' + classSuffix,
    state: 'ACTIVE',
    cardTitle: locale('Dolomiti NordicSki'),
    header: locale(presentation.productCode === 'sk-instructor' ? 'DNS Ski Instructor Pass 2026/27' : 'DNS Saisonkarte 2026/27'),
    subheader: locale(presentation.holderName),
    barcode: { type:'QR_CODE', value:presentation.barcodeUrl },
    textModulesData: [{ id:'pass-type', header:'Pass', body: presentation.productCode === 'sk-instructor' ? 'Ski Instructor' : 'Season Pass' }, { id:'pass-number', header:'Kartennummer', body:presentation.serial }],
    hexBackgroundColor: '#0D4D5E'
    // Google Wallet issuer must create/approve the Class and sign the save JWT.
  };
}
