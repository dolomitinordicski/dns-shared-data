import assert from 'node:assert/strict';
import { PARTNER_IMPORT_COLUMNS, selectPartnerImportValues, stageLegacyPartnerResponse } from '../dist/partner-import-selection.js';

const row=Array(95).fill('');
row[0]='17.02.2026 16:16:04';
row[3]='Example Hotel';
row[15]='JA SI';
row[31]='JA SI'; // historical DNS logo: explicitly excluded
row[35]='NEIN'; // retired plaque: explicitly excluded
row[45]='guest statistic'; // survey: explicitly excluded
row[1]='respondent@example.test'; // respondent address: excluded from active profile
const fields=selectPartnerImportValues(row);
assert.deepEqual(fields.map(f=>f.column),[4,16]);
assert.ok(fields.every(f=>f.verification==='pending'));
assert.ok(!PARTNER_IMPORT_COLUMNS.includes(2));
assert.ok(!PARTNER_IMPORT_COLUMNS.includes(32));
assert.ok(!PARTNER_IMPORT_COLUMNS.includes(36));
assert.equal(fields[0].value,'Example Hotel');
const staged=stageLegacyPartnerResponse(row,'row-2');
assert.equal(staged.status,'unmatched');
assert.equal(staged.establishmentId,null);
assert.equal(staged.sourceTimestamp,row[0]);
assert.equal(staged.sourceId,'row-2');
assert.throws(()=>stageLegacyPartnerResponse(row,' '),/Source row ID/);
console.log('Selective legacy import tests passed');
