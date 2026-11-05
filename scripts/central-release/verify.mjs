import { writeFile } from 'node:fs/promises';
import { verifyRelease } from './policy.mjs';

const { RELEASE_TARGET: target, RELEASE_SHA: sha, GH_TOKEN: token } = process.env;
const get = async path => {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
  });
  if (!response.ok) throw new Error(`Release evidence unavailable: HTTP ${response.status} at ${path}`);
  return response.json();
};
const plan = await verifyRelease({ target, sha, get });
await writeFile('central-release-plan.json', JSON.stringify(plan, null, 2) + '\n');
console.log(`Verified ${plan.repository}@${plan.sha}, PR #${plan.sourcePR}, target ${plan.project}/${plan.resource}`);
