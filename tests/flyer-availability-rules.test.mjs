import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import fs from 'node:fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-dns-core',
  firestore: { host: '127.0.0.1', port: 8088, rules: fs.readFileSync('firestore.rules', 'utf8') },
});

const policy = (uid) => ({
  schemaVersion: 1,
  enabled: {
    dns_price_list: true,
    regional_price_list: true,
    ticket_weekly_dns: false,
    ticket_weekly_area: false,
    ticket_daily_area: false,
    hotel_package: false,
    voucher: false,
    gutschein: false,
    promotion: false,
  },
  updatedAt: '2026-11-05T14:00:00.000Z',
  updatedBy: uid,
});

try {
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'admin'), { active: true, globalRoles: ['dns-admin'] });
    await setDoc(doc(db, 'users', 'area'), { active: true, globalRoles: [] });
    await setDoc(doc(db, 'users', 'inactive'), { active: false, globalRoles: [] });
    await setDoc(doc(db, 'accessGrants', 'area__reportingArea__drei-zinnen'), {
      userId: 'area',
      active: true,
      scopeType: 'reportingArea',
      scopeId: 'drei-zinnen',
      permissions: ['flyer.read'],
    });
    await setDoc(doc(db, 'flyerPolicyReaders', 'area'), {
      scopeType: 'reportingArea',
      scopeId: 'drei-zinnen',
    });
    await setDoc(doc(db, 'flyerAvailabilityPolicies', 'dns-global'), policy('admin'));
  });

  const admin = env.authenticatedContext('admin').firestore();
  const area = env.authenticatedContext('area').firestore();
  const inactive = env.authenticatedContext('inactive').firestore();
  const anonymous = env.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(admin, 'flyerAvailabilityPolicies', 'dns-global')));
  await assertSucceeds(getDoc(doc(area, 'flyerAvailabilityPolicies', 'dns-global')));
  // A reporting-area grant alone does not permit reading a global policy.
  // This reproduces the missing-index failure observed during workspace onboarding.
  await env.withSecurityRulesDisabled(async ctx => {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(ctx.firestore(), 'flyerPolicyReaders', 'area'));
  });
  await assertFails(getDoc(doc(area, 'flyerAvailabilityPolicies', 'dns-global')));
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'flyerPolicyReaders', 'area'), {
      scopeType: 'reportingArea', scopeId: 'drei-zinnen',
    });
  });
  await assertSucceeds(getDoc(doc(area, 'flyerAvailabilityPolicies', 'dns-global')));

  await assertFails(getDoc(doc(inactive, 'flyerAvailabilityPolicies', 'dns-global')));
  await assertFails(getDoc(doc(anonymous, 'flyerAvailabilityPolicies', 'dns-global')));

  await assertSucceeds(updateDoc(doc(admin, 'flyerAvailabilityPolicies', 'dns-global'), {
    enabled: { ...policy('admin').enabled, ticket_weekly_dns: true },
    updatedAt: '2026-11-05T14:01:00.000Z',
    updatedBy: 'admin',
  }));

  await assertFails(updateDoc(doc(area, 'flyerAvailabilityPolicies', 'dns-global'), {
    enabled: { ...policy('area').enabled, promotion: true },
    updatedAt: '2026-11-05T14:02:00.000Z',
    updatedBy: 'area',
  }));

  await assertFails(setDoc(doc(admin, 'flyerAvailabilityPolicies', 'bad'), policy('admin')));
  await assertFails(updateDoc(doc(admin, 'flyerAvailabilityPolicies', 'dns-global'), {
    enabled: { dns_price_list: true },
    updatedAt: '2026-11-05T14:03:00.000Z',
    updatedBy: 'admin',
  }));

  console.log('flyerAvailabilityPolicies Firestore rules passed');
} finally {
  await env.cleanup();
}
