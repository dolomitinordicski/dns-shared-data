/** Reviewable admin configuration plan. No cloud calls or changes. */
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const QR_LOG_EXCLUSION_FILTER = 'resource.type="cloud_run_revision" AND resource.labels.service_name="digitalpassapi" AND logName="projects/dns-core/logs/run.googleapis.com%2Frequests" AND httpRequest.requestUrl =~ "/(p|v)/"';
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
console.log('PLAN ONLY: approval is required before executing cloud configuration changes.');
console.log('Exclude only request logs containing bearer QR URLs; retain other request and administrator logs.');
console.log("gcloud logging exclusions create dns-digital-pass-qr-token --project=dns-core --description='Avoid storing bearer QR URLs for Digital Pass only' --log-filter='" + QR_LOG_EXCLUSION_FILTER + "'");
console.log('Do not overwrite an existing exclusion. First inspect its filter and reconcile any difference.');
}
