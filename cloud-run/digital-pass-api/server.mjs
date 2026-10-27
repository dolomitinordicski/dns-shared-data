import { createServer } from 'node:http';

const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('INVALID_PORT');

export function handler(request, response) {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  if (request.method === 'GET' && pathname === '/healthz') {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ status: 'ok', service: 'dns-digital-pass-api' }));
    return;
  }
  response.writeHead(404, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify({ error: 'NOT_FOUND' }));
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  createServer(handler).listen(port, '0.0.0.0');
}
