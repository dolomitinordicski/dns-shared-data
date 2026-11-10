/** Closed technical probe: no Auth, database, secret, inventory or provider dependency. */
export function closedDigitalPassHandler(allowedOrigins) {
 return async (req,res)=>{
  res.set('Cache-Control','no-store');res.set('Vary','Origin');
  res.set('Referrer-Policy','no-referrer');res.set('X-Content-Type-Options','nosniff');
  const origin=req.get('Origin');
  if(origin&&!allowedOrigins.includes(origin))return res.status(403).json({error:'FORBIDDEN'});
  if(origin)res.set('Access-Control-Allow-Origin',origin);
  if(req.method==='OPTIONS'){
   res.set('Access-Control-Allow-Headers','Authorization, Content-Type');
   res.set('Access-Control-Allow-Methods','POST, OPTIONS');return res.status(204).end();
  }
  return res.status(503).json({error:'SERVICE_UNAVAILABLE'});
 };
}
