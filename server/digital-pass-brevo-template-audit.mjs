import {brevoRequest,brevoJson} from './digital-pass-brevo-request.mjs';
/** Metadata inspection only; it does not replace a real DOI acceptance test. */
export async function inspectBrevoDoiTemplates({apiKey,templateIds,fetchImpl=fetch}) {
 if(typeof apiKey!=='string'||!apiKey)throw Error('BREVO_KEY_REQUIRED');
 if(!templateIds || !Object.keys(templateIds).length || Object.entries(templateIds).some(([lang,id])=>!['it','de','en'].includes(lang)||!Number.isSafeInteger(id)||id<=0||[2,3,4].includes(id)))throw Error('DIGITAL_PASS_DOI_TEMPLATES_NOT_APPROVED');
 const results={};
 for(const [language,id] of Object.entries(templateIds)){
  const response=await brevoRequest(fetchImpl,'https://api.brevo.com/v3/smtp/templates/'+id,{method:'GET',headers:{'api-key':apiKey,accept:'application/json'}});
  if(!response.ok)throw Error('BREVO_TEMPLATE_LOOKUP_FAILED');
  const info=await brevoJson(response);const html=typeof info.htmlContent==='string'?info.htmlContent:'';
  const hasOptinTag=/\{\{\s*optin\s*\}\}/i.test(html);
  results[language]={templateId:id,active:info.isActive===true,hasOptinTag,
    compatible:info.isActive===true&&hasOptinTag,liveDoiVerified:false};
 }
 const missingLanguages=['it','de','en'].filter(lang=>!Object.hasOwn(templateIds,lang));
 return {compatible:missingLanguages.length===0&&Object.values(results).every(x=>x.compatible),missingLanguages,templates:results};
}
