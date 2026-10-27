/**
 * Clones the agency's three DOI templates into separate DNS Digital Pass templates.
 * Safety: does not UPDATE source templates, never sends emails, creates INACTIVE clones.
 * By default dry-runs (GET only); --apply must be explicitly supplied.
 * BREVO_API_KEY must be provided via secure runtime environment, never as CLI arg.
 */
export const SOURCES = Object.freeze([
 {lang:'it',id:2,name:'DNS Digital Pass DOI – IT'},
 {lang:'de',id:3,name:'DNS Digital Pass DOI – DE'},
 {lang:'en',id:4,name:'DNS Digital Pass DOI – EN'}
]);
const api='https://api.brevo.com/v3/smtp/templates';
const oldTag=/\{\{\s*doubleoptin\s*\}\}/gi;
const newTag='{{ params.DOIurl }}';
async function jsonResponse(res) {
 if(!res.ok) throw Error('BREVO_TEMPLATE_API_FAILED_'+res.status);
 return res.json();
}
export function adaptHtml(html) {
 if(typeof html!=='string'||html.length<10)throw Error('SOURCE_HTML_UNAVAILABLE');
 const occurrences=[...html.matchAll(oldTag)].length;
 if(occurrences!==1)throw Error('UNEXPECTED_DOI_TAG_COUNT_'+occurrences);
 // Keep every other byte of the agency design unchanged.
 return html.replace(oldTag,newTag);
}
export async function cloneDoiTemplates({apiKey,fetchImpl=fetch,apply=false}) {
 if(typeof apiKey!=='string'||!apiKey)throw Error('BREVO_API_KEY_REQUIRED');
 const headers={'api-key':apiKey,accept:'application/json'};
 const result=[];
 for(const source of SOURCES) {
  const existing=await jsonResponse(await fetchImpl(api+'/'+source.id,{headers}));
  if(existing.id!==source.id||!existing.sender?.email||!existing.subject||!existing.htmlContent)
    throw Error('SOURCE_TEMPLATE_INCOMPLETE_'+source.id);
  const updatedHtml=adaptHtml(existing.htmlContent);
  if(!updatedHtml.includes(newTag))throw Error('DOI_TAG_MISSING');
  const output={language:source.lang,sourceId:source.id,sourceName:existing.name,
    targetName:source.name,action:apply?'CREATE_INACTIVE':'DRY_RUN'};
  if(apply) {
   const create={
    templateName:source.name,
    sender:{email:existing.sender.email,...(existing.sender.name?{name:existing.sender.name}:{})},
    subject:existing.subject,
    htmlContent:updatedHtml,
    isActive:false,
    ...(existing.replyTo?{replyTo:existing.replyTo}:{})
   };
   const created=await jsonResponse(await fetchImpl(api,{
    method:'POST',headers:{...headers,'content-type':'application/json'},
    body:JSON.stringify(create)
   }));
   if(!Number.isInteger(created.id)||created.id<=0)throw Error('INVALID_NEW_TEMPLATE_ID');
   const verified=await jsonResponse(await fetchImpl(api+'/'+created.id,{headers}));
   output.newId=created.id;
   output.isActive=verified.isActive;
   output.doiTemplate=verified.doiTemplate;
   output.hasDoiUrl=verified.htmlContent?.includes(newTag)===true;
   if(output.isActive!==false||output.doiTemplate!==true||!output.hasDoiUrl)
    throw Error('CLONE_NEEDS_REVIEW_'+created.id);
  }
  result.push(output);
 }
 return result;
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
 const apply=process.argv.includes('--apply');
 cloneDoiTemplates({apiKey:process.env.BREVO_API_KEY,apply})
  .then(result=>{process.stdout.write(JSON.stringify(result,null,2)+'\n');})
  .catch(err=>{process.stderr.write(err.message+'\n');process.exitCode=1;});
}
