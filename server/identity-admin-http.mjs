/** DNS Identity Administration: draft, NOT wired to a deployed function.
 * Provision an EXISTING Firebase Auth user only. Email invitations, new Auth
 * account creation and destructive operations require a separately audited flow.
 * Dependencies are injected so security logic can be tested without production.
 */
export function createIdentityAdminHandler({ auth, db, organizations, enabled = false }) {
  const allowedPermissions = [
    'ticketOrders.read', 'ticketOrders.write', 'ticketSales.read',
    'ticketSales.write', 'kp.read', 'kp.write', 'pricing.read',
    'flyer.read', 'flyer.write',
  ];
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!enabled) return res.status(503).json({ error: 'DISABLED' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    try {
      const caller = await auth.verifyIdToken(token, true);
      const adminDoc = await db.collection('users').doc(caller.uid).get();
      if (!adminDoc.exists || adminDoc.data()?.active !== true ||
          !adminDoc.data()?.globalRoles?.includes('dns-admin'))
        return res.status(403).json({ error: 'FORBIDDEN' });
      if (req.path !== '/v1/area-admin/provision-existing')
        return res.status(404).json({ error: 'NOT_FOUND' });
      const { uid, organizationId, reportingAreaId } = req.body || {};
      if (typeof uid !== 'string' || !/^[A-Za-z0-9:_-]{5,128}$/.test(uid) ||
          typeof organizationId !== 'string' || typeof reportingAreaId !== 'string')
        return res.status(400).json({ error: 'INVALID_INPUT' });
      const org = organizations.find(o => o.id === organizationId && o.active &&
        o.organizationType === 'tourism-organisation');
      if (!org || !org.reportingAreaIds.includes(reportingAreaId))
        return res.status(400).json({ error: 'INVALID_ORGANIZATION_AREA' });
      const target = await auth.getUser(uid);
      if (target.disabled || !target.emailVerified)
        return res.status(409).json({ error: 'TARGET_NOT_ACTIVE_VERIFIED' });
      const membershipId = `${uid}__${organizationId}`;
      const grantId = `${uid}__reportingArea__${reportingAreaId}`;
      const userRef = db.collection('users').doc(uid);
      const membershipRef = db.collection('memberships').doc(membershipId);
      const grantRef = db.collection('accessGrants').doc(grantId);
      const auditRef = db.collection('identityAdminAudit').doc();
      await db.runTransaction(async tx => {
        const [user, membership, grant] = await Promise.all([
          tx.get(userRef), tx.get(membershipRef), tx.get(grantRef),
        ]);
        if (user.exists || membership.exists || grant.exists)
          throw Object.assign(new Error('EXISTING_RECORD_REQUIRES_REVIEW'), { statusCode: 409 });
        const now = new Date().toISOString();
        tx.create(userRef, { id: uid, active: true, globalRoles: [], createdAt: now, updatedAt: now });
        tx.create(membershipRef, {
          id: membershipId, userId: uid, organizationId,
          role: 'contributor', active: true, createdAt: now, updatedAt: now,
        });
        tx.create(grantRef, {
          id: grantId, userId: uid, scopeType: 'reportingArea', scopeId: reportingAreaId,
          permissions: allowedPermissions, active: true,
          grantedBy: caller.uid, grantReason: 'Workspace Area Admin provisioning',
          createdAt: now, updatedAt: now,
        });
        tx.create(auditRef, { actorUid: caller.uid, targetUid: uid, action: 'area-admin.provision',
          organizationId, reportingAreaId, timestamp: now });
      });
      return res.status(201).json({ status: 'CREATED' });
    } catch (error) {
      if (error?.statusCode === 409) return res.status(409).json({ error: error.message });
      // No raw errors, user data or credentials in responses.
      return res.status(503).json({ error: 'SERVICE_UNAVAILABLE' });
    }
  };
}
