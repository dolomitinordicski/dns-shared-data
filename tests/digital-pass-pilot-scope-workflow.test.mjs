import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('manual release forwards the reviewed pilot scope to the release builder',()=>{
 const workflow=readFileSync('.github/workflows/deploy-digital-pass-pilot.yml','utf8');
 const deploy=workflow.split('\n  deploy:\n')[1];
 assert.match(deploy,/^      DNS_PASS_PILOT_SCOPE: \$\{\{ vars\.DNS_PASS_PILOT_SCOPE \}\}$/m);
});
