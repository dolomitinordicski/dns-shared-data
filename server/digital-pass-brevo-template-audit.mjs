/** Read-only Brevo DOI template compatibility check. Does not send email or modify templates. */
const TEMPLATE_IDS=Object.freeze({it:2,de:3,en:4});
export async function inspectBrevoDoiTemplates({apiKey,fetchImpl=fetch}) {
 if(typeof apiKey!=='string'||!apiKey)throw new Error('BREVO_KEY_REQUIRED');
 const results={};
 for(const [language,id] of Object.entries(TEMPLATE_IDS)) {
  const response=await fetchImpl('https://api.brevo.com/v3/smtp/templates/'+id,{
   method:'GET',headers:{'api-key':apiKey,accept:'application/json'}
  });
  if(!response.ok)throw new Error('BREVO_TEMPLATE_LOOKUP_FAILED');
  const info=await response.json();
  const html=typeof info.htmlContent==='string'?info.htmlContent:'';
  // Brevo says DOI templates must reference params.DOIurl. Check in raw HTML,
  // not rendered/tracked links in the email.
  results[language]={templateId:id,active:info.isActive===true,doiTemplate:info.doiTemplate===true,
   hasDoiUrl:html.includes('params.DOIurl'),
   compatible:info.isActive===true&&info.doiTemplate===true&&html.includes('params.DOIurl')};
 }
 return {compatible:Object.values(results).every(item=>item.compatible),templates:results};
}
