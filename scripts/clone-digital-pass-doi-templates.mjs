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
 // Inventory first: existing copies must be reused, never duplicated.
 // Fetch pages rather than assuming a fixed total number of templates.
 const catalog=[];
 for(let offset=0;offset<10000;offset+=100){
  const page=await jsonResponse(await fetchImpl(api+'?limit=100&offset='+offset,{headers}));
  if(!Array.isArray(page.templates))throw Error('BREVO_TEMPLATE_CATALOG_UNAVAILABLE');
  catalog.push(...page.templates);
  if(page.templates.length<100)break;
  if(offset>=9900)throw Error('BREVO_TEMPLATE_CATALOG_TOO_LARGE');
 }
 for(const source of SOURCES) {
  const existing=await jsonResponse(await fetchImpl(api+'/'+source.id,{headers}));
  if(existing.id!==source.id||!existing.sender?.email||!existing.subject||!existing.htmlContent)
    throw Error('SOURCE_TEMPLATE_INCOMPLETE_'+source.id);
  const updatedHtml=adaptHtml(existing.htmlContent);
  if(!updatedHtml.includes(newTag))throw Error('DOI_TAG_MISSING');
  const matches=catalog.filter(x=>x.name===source.name);
  if(matches.length>1)throw Error('DUPLICATE_TARGET_TEMPLATES_'+source.lang);
  const output={language:source.lang,sourceId:source.id,sourceName:existing.name,
    targetName:source.name,action:matches.length?'REUSE_EXISTING':apply?'CREATE_INACTIVE':'DRY_RUN'};
  if(matches.length){
   const copy=await jsonResponse(await fetchImpl(api+'/'+matches[0].id,{headers}));
   if(copy.name!==source.name||copy.htmlContent!==updatedHtml||copy.subject!==existing.subject)
     throw Error('EXISTING_CLONE_MISMATCH_'+copy.id);
   output.newId=copy.id;
   output.isActive=copy.isActive;
   output.doiTemplate=copy.doiTemplate;
   output.hasDoiUrl=copy.htmlContent.includes(newTag);
   output.readyForDoi=copy.isActive===true&&copy.doiTemplate===true&&output.hasDoiUrl;
  } else if(apply) {
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
   if(output.isActive!==false||!output.hasDoiUrl)
    throw Error('CLONE_NEEDS_REVIEW_'+created.id);
   // Brevo may not classify a newly created inactive template as DOI.
   // Report it rather than aborting after creating a copy.
   output.readyForDoi=false;
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
