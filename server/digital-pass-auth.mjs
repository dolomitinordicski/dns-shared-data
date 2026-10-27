/** Trusted server projection of the existing DNS Core identity contract. */
export async function loadDigitalPassActor({ db, auth, idToken, now = Date.now() }) {
  if (typeof idToken !== 'string' || !idToken) throw new Error('UNAUTHORIZED');
  const identity = await auth.verifyIdToken(idToken, true);
  const uid = identity.uid;
  const [profile, memberships, grants] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('memberships').where('userId', '==', uid).get(),
    db.collection('accessGrants').where('userId', '==', uid).get(),
  ]);
  if (!profile.exists || profile.data().active !== true) throw new Error('FORBIDDEN');
  const date = new Date(now).toISOString().slice(0, 10);
  const active = value => value.active === true &&
    (!value.validFrom || /^\d{4}-\d{2}-\d{2}$/.test(value.validFrom) && value.validFrom <= date) &&
    (!value.validTo || /^\d{4}-\d{2}-\d{2}$/.test(value.validTo) && value.validTo >= date);
  const organizations = new Set(memberships.docs.map(s => s.data())
    .filter(m => m.userId === uid && active(m)).map(m => m.organizationId));
  return {
    uid,
    isDnsAdmin: profile.data().globalRoles?.includes('dns-admin') === true,
    grants: grants.docs.map(s => s.data()).filter(g => g.userId === uid && active(g) &&
      g.scopeType === 'organization' && organizations.has(g.scopeId))
      .map(g => ({ organizationId: g.scopeId, permissions: g.permissions })),
  };
}
