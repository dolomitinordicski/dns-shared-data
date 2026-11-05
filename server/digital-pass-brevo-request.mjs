/** Bounded provider I/O. Never used by pass issuance, Firebase Auth or QR validation. */
export async function brevoRequest(fetchImpl, url, options, timeoutMs = 15000) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30000) throw Error('INVALID_BREVO_TIMEOUT');
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => fetchImpl(url, {...options, signal:controller.signal})),
      new Promise((_,reject) => { timer=setTimeout(() => { controller.abort(); reject(Error('BREVO_TIMEOUT')); }, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

/** Bound body parsing separately: a server can send headers then stall the body. */
export async function brevoJson(response, timeoutMs=15000) {
 let timer;
 try {return await Promise.race([response.json(),new Promise((_,reject)=>{
  timer=setTimeout(()=>reject(Error('BREVO_BODY_TIMEOUT')),timeoutMs);
 })]);} finally {clearTimeout(timer)}
}
