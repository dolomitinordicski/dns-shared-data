import { authorizePollsNetwork } from './polls-access.mjs';
import { createManagedEvent, listManagedEvents } from './polls-events.mjs';

const ACTION_PERMISSION = {
  'events.list': 'events.read',
  'events.create': 'events.manage',
};

export function createPollsBridgeHandler({ auth, coreDb, pollsDb, allowedOrigins }) {
  if (!auth || !coreDb || !pollsDb || !Array.isArray(allowedOrigins) ||
      !allowedOrigins.length || !allowedOrigins.every(o => /^https:\/\/[^/]+$/.test(o))) {
    throw new Error('POLLS_BRIDGE_CONFIGURATION_REQUIRED');
  }
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('Vary', 'Origin');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('X-Content-Type-Options', 'nosniff');
    const origin = req.get('Origin') || '';
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    if (origin) res.set('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      return res.status(204).end();
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    if (!req.is('application/json') || !req.body || typeof req.body !== 'object' ||
        Array.isArray(req.body) || Buffer.byteLength(JSON.stringify(req.body)) > 8192) {
      return res.status(400).json({ error: 'INVALID_REQUEST' });
    }
    const action = req.body.action;
    const permission = Object.hasOwn(ACTION_PERMISSION, action) ? ACTION_PERMISSION[action] : null;
    if (!permission || Object.keys(req.body).some(k => k !== 'action' && k !== 'event')) {
      return res.status(400).json({ error: 'INVALID_REQUEST' });
    }
    const match = /^Bearer (\S+)$/.exec(req.get('Authorization') || '');
    if (!match) return res.status(401).json({ error: 'UNAUTHORIZED' });
    try {
      // All permissions are resolved from authoritative DNS Core on every request.
      await authorizePollsNetwork({ auth, coreDb, idToken: match[1], permission });
      if (action === 'events.list') {
        if ('event' in req.body) throw new Error('INVALID_EVENT');
        return res.status(200).json({ events: await listManagedEvents(pollsDb) });
      }
      return res.status(201).json({ event: await createManagedEvent(pollsDb, req.body.event) });
    } catch (err) {
      if (err?.message === 'INVALID_EVENT') return res.status(400).json({ error: 'INVALID_EVENT' });
      if (err?.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN' });
      if (err?.message === 'UNAUTHORIZED' || err?.code?.startsWith('auth/')) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
      }
      // Never send provider, Firestore, token or permission details to clients.
      return res.status(503).json({ error: 'SERVICE_UNAVAILABLE' });
    }
  };
}
