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
    .filter(m => m.userId === uid && active(m) && typeof m.organizationId === 'string' && m.organizationId)
    .map(m => m.organizationId));
  const activeGrants = grants.docs.map(s => s.data()).filter(g => g.userId === uid && active(g));
  const reportingAreaGrants = activeGrants.filter(g =>
    g.scopeType === 'reportingArea' && typeof g.scopeId === 'string' && g.scopeId);
  const organizationAreas = new Map();
  if (reportingAreaGrants.length) {
    await Promise.all([...organizations].map(async organizationId => {
      const organization = await db.collection('organizations').doc(organizationId).get();
      if (!organization.exists) return;
      const value = organization.data();
      const areas = Array.isArray(value.reportingAreaIds) ? value.reportingAreaIds :
        typeof value.reportingAreaId === 'string' ? [value.reportingAreaId] : [];
      organizationAreas.set(organizationId, new Set(areas.filter(area =>
        typeof area === 'string' && area)));
    }));
  }
  const scopedGrants = [];
  for (const grant of activeGrants) {
    if (grant.scopeType === 'organization' && organizations.has(grant.scopeId)) {
      scopedGrants.push({ organizationId: grant.scopeId, permissions: grant.permissions });
      continue;
    }
    // Workspace Identity grants reporting areas, while Digital Pass operations
    // authorize against the exact inventory organizationId. Project an area
    // grant only through this actor's active membership; never fan it out to all
    // organizations sharing the same reportingAreaId.
    if (grant.scopeType === 'reportingArea') {
      for (const organizationId of organizations) {
        if (organizationAreas.get(organizationId)?.has(grant.scopeId)) {
          scopedGrants.push({
            organizationId,
            reportingAreaId: grant.scopeId,
            permissions: grant.permissions,
          });
        }
      }
    }
  }
  return {
    uid,
    isDnsAdmin: profile.data().globalRoles?.includes('dns-admin') === true,
    grants: scopedGrants,
  };
}
