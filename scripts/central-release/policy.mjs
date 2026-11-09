import assert from 'node:assert/strict';

export const targets = Object.freeze({
  faktura: Object.freeze({ repository: 'dolomitinordicski/DNS-Faktura', project: 'dns-core',
    resource: 'functions:resolvePublicConfirmation,functions:submitPublicConfirmation',
    contract: 'release/central-functions-contract.json',
    workflows: ['faktura-central-release-preflight.yml', 'faktura-v2-domain-tests.yml', 'deploy-pages.yml'] }),
  polls: Object.freeze({ repository: 'dolomitinordicski/DNS-Polls-tool', project: 'dns-polls',
    resource: 'firestore:rules', contract: 'release/central-rules-contract.json',
    workflows: ['polls-central-rules-preflight.yml', 'test-event-rules.yml'] }),
});

export async function verifyRelease({ target, sha, get }) {
  assert.ok(Object.hasOwn(targets, target), 'Unknown release target');
  assert.match(sha, /^[a-f0-9]{40}$/, 'Full immutable SHA required');
  const policy = targets[target];
  const root = `/repos/${policy.repository}`;
  const ancestry = await get(`${root}/compare/${sha}...main`);
  assert.ok(['ahead', 'identical'].includes(ancestry.status), 'SHA is not on main');
  const prs = await get(`${root}/commits/${sha}/pulls?per_page=100`);
  const pr = prs.find(p => p.merged_at && p.merge_commit_sha === sha && p.base.ref === 'main'
    && p.base.repo.full_name === policy.repository && p.head.repo?.full_name === policy.repository);
  assert.ok(pr, 'Require exact merged PR commit from the allowlisted repository');
  const rulesets = await get(`${root}/rulesets?includes_parents=true`);
  const protections = [];
  for (const ruleset of rulesets) {
    if (ruleset.enforcement !== 'active' || ruleset.target !== 'branch') continue;
    const detail = await get(`${root}/rulesets/${ruleset.id}`);
    const refs = detail.conditions?.ref_name;
    if (!refs || refs.exclude?.length || !refs.include?.some(r => ['~ALL', '~DEFAULT_BRANCH', 'refs/heads/main'].includes(r))) continue;
    assert.equal(detail.bypass_actors?.length, 0, 'Source protection must not allow bypass');
    protections.push(...detail.rules);
  }
  assert.ok(protections.some(r => r.type === 'pull_request' && r.parameters.required_approving_review_count >= 1), 'Reviewed source main protection required');
  assert.ok(protections.some(r => r.type === 'non_fast_forward'), 'Source force pushes must be blocked');
  assert.ok(protections.some(r => r.type === 'deletion'), 'Source deletion must be blocked');
  const reviews = await get(`${root}/pulls/${pr.number}/reviews?per_page=100`);
  assert.ok(reviews.length < 100, 'Review pagination requires explicit handling');
  const latest = new Map();
  for (const review of reviews) latest.set(review.user.login, review);
  const approvers = [];
  for (const [login, review] of latest) {
    if (login === pr.user.login || review.state !== 'APPROVED' || review.commit_id !== pr.head.sha) continue;
    // Do not confuse connector visibility or public association with write permission.
    const permission = await get(`${root}/collaborators/${encodeURIComponent(login)}/permission`);
    if (['write', 'maintain', 'admin'].includes(permission.permission)) approvers.push(login);
  }
  const requiredReviews = Math.max(...protections.filter(r => r.type === 'pull_request').map(r => r.parameters.required_approving_review_count));
  assert.ok(approvers.length >= requiredReviews, 'Current-head approvals by enough eligible independent reviewers required');
  const ci = [];
  for (const file of policy.workflows) {
    const response = await get(`${root}/actions/workflows/${file}/runs?head_sha=${pr.head.sha}&event=pull_request&per_page=100`);
    assert.ok(response.workflow_runs?.length < 100, 'CI pagination requires explicit handling');
    const run = response.workflow_runs?.[0];
    assert.ok(run && run.head_sha === pr.head.sha && run.head_repository?.full_name === policy.repository
      && run.path === `.github/workflows/${file}` && run.status === 'completed' && run.conclusion === 'success', `Required source CI not successful: ${file}`);
    ci.push({ file, runId: run.id });
  }
  return { schemaVersion: 1, target, sha, ...policy, sourcePR: pr.number, approvers, ci };
}
