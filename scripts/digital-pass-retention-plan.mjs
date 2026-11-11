/** Prints an administrator-reviewed plan only. Does not authenticate or change cloud resources. */
import {DIGITAL_PASS_TTL_COLLECTIONS, RETENTION_FIELD} from '../server/digital-pass-retention.mjs';
for (const group of DIGITAL_PASS_TTL_COLLECTIONS) {
 console.log(`gcloud firestore fields ttls update ${RETENTION_FIELD} --collection-group=${group} --database='(default)' --project=dns-core --enable-ttl`);
}
console.log('PLAN ONLY. Execution requires separate production configuration approval.');
console.log('Only documents carrying the namespaced timestamp are eligible; no backfill is included.');
console.log('Verify every policy is ACTIVE before ACTIVATE. TTL deletion is asynchronous and is not a 24-hour SLA.');
