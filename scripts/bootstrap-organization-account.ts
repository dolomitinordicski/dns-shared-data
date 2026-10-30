/**
 * One login per DNS tourism organization. Safe CLI: dry-run by default.
 * Create/verify Firebase Auth account separately; do not share a password here.
 * For actual provisioning use --apply plus explicit project confirmation.
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { prepareAreaAdminProvisioning } from '../src/area-admin-provisioning.js';

const arg = (name: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const email = arg('email')?.trim().toLowerCase();
const organizationId = arg('organization');
const reportingAreaId = arg('area');
const language = arg('language') ?? 'de';
const apply = process.argv.includes('--apply');
const project = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID;
if (!email || !organizationId || !reportingAreaId ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !['de','it','en'].includes(language)) {
  throw new Error('Usage: --email=... --organization=... --area=... [--language=de|it|en] [--apply].');
}
const dryRun = prepareAreaAdminProvisioning({
  uid: 'preview-user-123', organizationId: organizationId as Parameters<typeof prepareAreaAdminProvisioning>[0]['organizationId'],
  reportingAreaId, preferredLanguage: language as 'de'|'it'|'en',
});
console.log(JSON.stringify({ mode: apply ? 'APPLY' : 'DRY_RUN', email, organizationId,
  reportingAreaId, permissions: dryRun.grant.permissions }, null, 2));
if (apply) {
  if (project !== 'dns-core' || arg('confirm-project') !== 'dns-core') {
    throw new Error('Refusing production write without explicit dns-core project and --confirm-project=dns-core.');
  }
  initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
  const auth = getAuth();
  const db = getFirestore();
  const account = await auth.getUserByEmail(email);
  if (account.disabled || !account.emailVerified) throw new Error('Account must be enabled and email-verified.');
  const record = prepareAreaAdminProvisioning({
    uid: account.uid, organizationId: organizationId as Parameters<typeof prepareAreaAdminProvisioning>[0]['organizationId'],
    reportingAreaId, preferredLanguage: language as 'de'|'it'|'en',
  });
  const userRef = db.collection('users').doc(account.uid);
  const memberRef = db.collection('memberships').doc(record.membership.id);
  const grantRef = db.collection('accessGrants').doc(record.grant.id);
  const auditRef = db.collection('identityAdminAudit').doc();
  await db.runTransaction(async tx => {
    const [user, membership, grant] = await Promise.all([tx.get(userRef), tx.get(memberRef), tx.get(grantRef)]);
    if (user.exists || membership.exists || grant.exists) throw new Error('Existing identity records require manual review. No overwrite.');
    tx.create(userRef, { ...record.user, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    tx.create(memberRef, { ...record.membership, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    tx.create(grantRef, { ...record.grant, grantedBy: 'dns-org-account-bootstrap', grantReason: 'Organization account initial provisioning', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    tx.create(auditRef, { action:'organization-account.provision', targetUid:account.uid,
      organizationId, reportingAreaId, timestamp:FieldValue.serverTimestamp(), source:'manual-cli' });
  });
  console.log('Created organization-scoped identity. No global admin rights.');
}
