/** Reviewable admin configuration plan. No cloud calls or changes. */
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const QR_LOG_EXCLUSION_FILTER = 'resource.type="cloud_run_revision" AND resource.labels.service_name="digitalpassapi" AND logName="projects/dns-core/logs/run.googleapis.com%2Frequests" AND httpRequest.requestUrl =~ "/(p|v)/"';
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
console.log('PLAN ONLY: approval is required before executing cloud configuration changes.');
console.log('Exclude only request logs containing bearer QR URLs; retain other request and administrator logs.');
console.log('POST https://logging.googleapis.com/v2/projects/dns-core/exclusions');
console.log(JSON.stringify({name:'dns-digital-pass-qr-token',description:'Avoid storing bearer QR URLs for Digital Pass only',filter:QR_LOG_EXCLUSION_FILTER,disabled:false},null,2));
console.log('Use an existing authenticated administrator session; do not print its access token. This plan sends no request.');
console.log('Do not overwrite an existing exclusion. First inspect its filter and reconcile any difference.');
}
