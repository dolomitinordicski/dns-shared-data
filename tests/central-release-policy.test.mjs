import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyRelease } from '../scripts/central-release/policy.mjs';
const sha = 'a'.repeat(40), head = 'b'.repeat(40), repo = 'dolomitinordicski/DNS-Faktura';
function evidence(overrides = {}) {
  return async path => {
    if (path.includes('/compare/')) return { status: overrides.ancestry ?? 'ahead' };
    if (path.includes('/commits/')) return [{ merged_at: '2026-11-05', merge_commit_sha: sha, number: 45,
      user: { login: 'author' }, base: { ref: 'main', repo: { full_name: repo } }, head: { sha: head, repo: { full_name: overrides.repository ?? repo } } }];
    if (path.endsWith('includes_parents=true')) return [{ id: 1, enforcement: 'active', target: 'branch' }];
    if (path.endsWith('/rulesets/1')) return { conditions: { ref_name: { include: ['~DEFAULT_BRANCH'], exclude: [] } }, bypass_actors: overrides.bypass ?? [],
      rules: [{ type: 'deletion' }, { type: 'non_fast_forward' }, { type: 'pull_request', parameters: { required_approving_review_count: 1 } }] };
    if (path.includes('/reviews?')) return [{ user: { login: overrides.reviewer ?? 'reviewer' }, state: 'APPROVED', commit_id: overrides.stale ? sha : head }];
    if (path.includes('/permission')) return { permission: overrides.permission ?? 'write' };
    if (path.includes('/actions/workflows/')) { const file = path.split('/actions/workflows/')[1].split('/')[0]; return { workflow_runs: [{ id: 123, head_sha: head, head_repository: { full_name: repo }, path: `.github/workflows/${file}`, status: 'completed', conclusion: Object.hasOwn(overrides, 'ci') ? overrides.ci : 'success' }] }; }
    throw Error(`Unexpected evidence request: ${path}`);
  };
}
test('verified Faktura plan cannot select Polls or unrestricted Functions', async () => {
  const p = await verifyRelease({ target: 'faktura', sha, get: evidence() });
  assert.equal(p.project, 'dns-core');
  assert.equal(p.resource, 'functions:resolvePublicConfirmation,functions:submitPublicConfirmation');
});
for (const [name, overrides] of Object.entries({ outsideMain: { ancestry: 'diverged' }, fork: { repository: 'attacker/repo' }, readOnly: { permission: 'read' }, stale: { stale: true }, selfReview: { reviewer: 'author' }, bypass: { bypass: [{}] }, failedCI: { ci: 'failure' }, pendingCI: { ci: null } })) {
  test(`deny ${name}`, async () => assert.rejects(verifyRelease({ target: 'faktura', sha, get: evidence(overrides) })));
}
test('deny arbitrary target and floating SHA', async () => {
  for (const input of [{ target: '__proto__', sha }, { target: 'faktura', sha: 'main' }]) await assert.rejects(verifyRelease({ ...input, get: evidence() }));
});
test('deny unavailable evidence, never continue on API errors', async () => {
  await assert.rejects(verifyRelease({ target: 'polls', sha, get: async () => { throw Error('403'); } }), /403/);
});
