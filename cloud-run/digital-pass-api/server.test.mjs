import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handler } from './server.mjs';

test('healthz is minimal and non-functional API routes fail closed', async () => {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = 'http://127.0.0.1:' + server.address().port;
    const ok = await fetch(base + '/healthz');
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { status: 'ok', service: 'dns-digital-pass-api' });
    const missing = await fetch(base + '/v1/pass-registrations/start', { method: 'POST' });
    assert.equal(missing.status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
