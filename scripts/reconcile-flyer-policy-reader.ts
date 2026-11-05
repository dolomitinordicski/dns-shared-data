/**
 * Read-only by default. Repair one existing DNS Workspace Area account's
 * private Flyer policy reader index, without granting any new permissions.
 *
 * Preview:
 *   GOOGLE_CLOUD_PROJECT=dns-core npx tsx scripts/reconcile-flyer-policy-reader.ts --uid=... --area=...
 * Explicit production apply requires --apply --confirm-project=dns-core.
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const arg = (name: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const uid = arg('uid'), area = arg('area');
const project = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID;
const apply = process.argv.includes('--apply');
const safeId = (value: unknown) => typeof value === 'string' && /^[A-Za-z0-9:_-]{1,128}$/.test(value);
if (!safeId(uid) || !safeId(area)) throw Error('Provide --uid and --area (valid Firestore IDs).');
if (project !== 'dns-core') throw Error('Expected dns-core project explicitly; no default credential project.');
if (apply && arg('confirm-project') !== 'dns-core') throw Error('Production write requires --confirm-project=dns-core.');
initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
const db = getFirestore();
const userRef = db.doc(`users/${uid}`);
const readerRef = db.doc(`flyerPolicyReaders/${uid}`);
const grantRef = db.doc(`accessGrants/${uid}__reportingArea__${area}`);
const assignmentQuery = db.collection('workspaceOrganizationAccounts').where('uid','==',uid).limit(2);
const [user, grant, reader, assignments] = await Promise.all([
  userRef.get(), grantRef.get(), readerRef.get(), assignmentQuery.get(),
]);
const assignment = assignments.docs.find(doc => doc.data().reportingAreaId === area);
const authorized = user.exists && user.data()?.active === true
  && grant.exists && grant.data()?.active === true
  && grant.data()?.scopeType === 'reportingArea' && grant.data()?.scopeId === area
  && grant.data()?.userId === uid
  && Array.isArray(grant.data()?.permissions) && grant.data()!.permissions.includes('flyer.read')
  && assignments.size === 1 && !!assignment;
const desired = { scopeType: 'reportingArea', scopeId: area };
const existing = reader.exists ? reader.data() : null;
console.log(JSON.stringify({
  mode: apply ? 'APPLY' : 'DRY_RUN', uid, area,
  eligible: authorized, readerState: !existing ? 'missing'
    : existing.scopeType === desired.scopeType && existing.scopeId === desired.scopeId
      ? 'matching' : 'conflict',
}, null, 2));
if (!authorized) throw Error('Account, scope, assignment or flyer.read grant not valid: refusing to change the index.');
if (existing && (existing.scopeType !== desired.scopeType || existing.scopeId !== desired.scopeId))
  throw Error('An existing reader points elsewhere: manual review required.');
if (apply && !existing) {
  await db.runTransaction(async tx => {
    const [profile, activeGrant, activeReader, activeAssignment] = await Promise.all([
      tx.get(userRef), tx.get(grantRef), tx.get(readerRef), tx.get(assignment!.ref),
    ]);
    if (!profile.exists || profile.data()?.active !== true
        || !activeGrant.exists || activeGrant.data()?.active !== true
        || activeGrant.data()?.userId !== uid
        || activeGrant.data()?.scopeId !== area
        || !activeGrant.data()?.permissions?.includes('flyer.read')
        || !activeAssignment.exists || activeAssignment.data()?.uid !== uid
        || activeAssignment.data()?.reportingAreaId !== area
        || activeReader.exists) throw Error('Concurrent state change: abort reconciliation.');
    tx.create(readerRef, desired);
  });
  console.log('Reader index created. Verify with the real Area identity; no new grant was issued.');
}
