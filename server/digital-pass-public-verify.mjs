import { createHash } from 'node:crypto';

// Public verification shows status only; it never exposes a holder's name, email or number.
// QR URLs are bearer credentials: do not embed them in analytics, logs or referrers.
export async function verifyPublicPass({ db, token, now = Date.now() }) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return 'UNKNOWN';
  const credentialId = createHash('sha256').update(token).digest('hex');
  const credential = await db.collection('digitalCredentials').doc(credentialId).get();
  if (!credential.exists) return 'UNKNOWN';
  const c = credential.data();
  const registration = await db.collection('passRegistrations').doc(c.physicalPassId).get();
  if (c.status !== 'ACTIVE' || !registration.exists ||
      registration.data().status !== 'ACTIVE' || registration.data().credentialId !== credentialId) return 'REVOKED';
  if (c.productCode !== 'sk-dns' || c.seasonId !== '2026-27' ||
      !Number.isFinite(c.validFrom) || !Number.isFinite(c.validUntil)) return 'UNKNOWN';
  if (now < c.validFrom || now >= c.validUntil) return 'EXPIRED';
  return 'VALID';
}
export function renderPublicPassHtml(status) {
  const states = {
    VALID: ['GÜLTIG · VALIDO · VALID', '#11764c', '✓'],
    EXPIRED: ['ABGELAUFEN · SCADUTO · EXPIRED', '#915d18', '!'],
    REVOKED: ['UNGÜLTIG · NON VALIDO · INVALID', '#ad3434', '×'],
    UNKNOWN: ['NICHT BESTÄTIGT · NON VERIFICATO · UNVERIFIED', '#ad3434', '?']
  };
  const [message,color,symbol] = states[status] || states.UNKNOWN;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="30"><title>Dolomiti NordicSki · Ticketkontrolle</title>
<style>html{font-family:system-ui,-apple-system,sans-serif;background:#f4f7f7;color:#142b2c}body{max-width:440px;margin:8vh auto;padding:20px;text-align:center}
.card{background:white;border-radius:20px;padding:36px 20px;box-shadow:0 10px 45px #17343819}
.status{color:${color};font-size:clamp(1.1rem,5vw,1.5rem);font-weight:800;margin:18px 0}
.signal{font-size:60px;color:${color};animation:pulse 1.8s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.16);opacity:.60}}
small{color:#597274}button{font:inherit;padding:12px 22px;background:#1b494b;color:white;border:0;border-radius:12px;margin-top:25px}</style></head>
<body><main class="card"><h2>DOLOMITI NORDICSKI</h2><div class="signal" aria-hidden="true">${symbol}</div>
<p class="status" role="status">${message}</p><p>DNS Saisonkarte 2026/27</p>
<small>Online geprüft · Verificato online · Checked online</small><div><button onclick="location.reload()">Aktualisieren · Aggiorna</button></div></main></body></html>`;
}
