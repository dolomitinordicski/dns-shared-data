import test from "node:test";
import assert from "node:assert/strict";
import {
  observeTool,
  lockDependency,
  versionState,
  projectTool,
  deploymentEvidence,
  validateSignal,
  fingerprint,
  createGitHubReader,
  snapshotAt,
  persistTool,
} from "../scripts/tool-registry-observer.mjs";
const sha = "a".repeat(40),
  oldSha = "b".repeat(40),
  dep = "@dolomitinordicski/dns-shared-data";
test('DNS Core service never inherits the Shared Data website deployment version', async () => {
  const service={id:'dns-core',repo:'dolomitinordicski/dns-shared-data',backend:{kind:'dns-core'}};
  const o=await observeTool(service,async()=>{throw Error('GitHub should not be queried for a service version');},async()=>({state:'na'}));
  const p=projectTool(service,o,{observations:{production:{foundation:'1.3.0'}}},{});
  assert.equal(p.versions.foundation,null);assert.equal(p.versions.state.foundation,'na');assert.equal(p.observations.quality,'service');
});
const tool = {
  id: "analytics",
  repo: "dolomitinordicski/analytics",
  visible: true,
  backend: { kind: "dns-core" },
};
const canonical = {
  foundation: { version: "1.3.0" },
  designSystem: { version: "1.25.0" },
  sharedData: { version: "1.3.0" },
};
const source = {
  sha,
  app: "3.0.1",
  foundation: "1.3.0",
  designSystem: "1.25.0",
  sharedData: "1.3.0",
  errors: [],
};
const observation = () => ({
  main: source,
  production: null,
  deployment: null,
  release: null,
  observedAt: "2026-11-06T22:00:00Z",
  web: { state: "active" },
  errors: [],
});
test("lockfile resolves exact tag commit rather than declared main version", () => {
  assert.equal(
    lockDependency(
      {
        dependencies: {
          [dep]: "github:dolomitinordicski/dns-shared-data#foundation-v1.3.0",
        },
      },
      {
        packages: {
          [`node_modules/${dep}`]: {
            version: "1.3.0",
            resolved: `git+ssh://git@github.com/dolomitinordicski/dns-shared-data.git#${sha}`,
          },
        },
      },
    ).sha,
    sha,
  );
});
test("main merge alone never promotes production", () => {
  const p = projectTool(tool, observation(), null, canonical);
  assert.equal(p.versions.foundation, null);
  assert.equal(p.observations.main.foundation, "1.3.0");
});
test("failed deployment keeps earlier successful production", async () => {
  const read = async (path) =>
    path.includes("/statuses")
      ? [
          {
            state: path.includes("/2/") ? "failure" : "success",
            updated_at: "now",
          },
        ]
      : [
          { id: 2, sha, environment: "github-pages" },
          { id: 1, sha: oldSha, environment: "github-pages" },
        ];
  const d = await deploymentEvidence(read, tool.repo);
  assert.equal(d.latest.state, "failure");
  assert.equal(d.successful.sha, oldSha);
});
test("preview deployment cannot promote production", async () => {
  const d = await deploymentEvidence(
    async () => [{ id: 1, sha, environment: "preview" }],
    tool.repo,
  );
  assert.equal(d.successful, null);
});
test("inactive is not proof of current production", async () => {
  const d = await deploymentEvidence(
    async (p) =>
      p.includes("/statuses")
        ? [{ state: "inactive" }]
        : [{ id: 1, sha, environment: "github-pages" }],
    tool.repo,
  );
  assert.equal(d.successful, null);
});
test("incomplete reconciliation preserves known production and exposes staleness", () => {
  const o = observation();
  o.errors.push("DEPLOYMENT_GITHUB_403");
  const p = projectTool(
    tool,
    o,
    { observations: { production: { ...source, sha: oldSha } } },
    canonical,
  );
  assert.equal(p.versions.foundation, "1.3.0");
  assert.equal(p.observations.quality, "stale");
  assert.deepEqual(p.observations.preserved, ["production"]);
});
test("successful deployment source and main stay distinct", () => {
  const o = observation();
  o.production = { ...source, sha: oldSha, foundation: "1.2.1" };
  const p = projectTool(tool, o, null, canonical);
  assert.equal(p.versions.foundation, "1.2.1");
  assert.equal(p.versions.updateRequired, true);
  assert.equal(p.observations.sourceDiffersFromProduction, true);
});
test("web HTTP 200 never proves Firebase functional health", () => {
  const p = projectTool(tool, observation(), null, canonical);
  assert.equal(p.health.firebase.state, "pending");
  assert.equal(p.health.connectivity, "pending");
});
test("unknown versions never count as current", () => {
  assert.equal(versionState(null, "1.3.0"), "unknown");
  assert.equal(versionState("github#main", "1.3.0"), "unknown");
});
test("dispatches are allowlisted; payload versions are not authoritative", () => {
  assert.throws(() =>
    validateSignal({ repository: "attacker/repo" }, [tool.repo]),
  );
  assert.equal(
    validateSignal({ repository: tool.repo, foundation: "99.0.0" }, [
      tool.repo,
    ]),
    tool.repo,
  );
});
test("transport errors do not masquerade as absent sources", async () => {
  const read = createGitHubReader("test", async () => ({
    ok: false,
    status: 403,
  }));
  await assert.rejects(
    read("/repos/dolomitinordicski/analytics"),
    /GITHUB_403/,
  );
  await assert.rejects(read("/repos/attacker/repo"), /UNTRUSTED/);
});
test("observation times do not cause meaningless version history", () => {
  assert.equal(
    fingerprint({ observedAt: "a", x: 1 }),
    fingerprint({ observedAt: "b", x: 1 }),
  );
});
test("pin/lock mismatch cannot claim installed Foundation", async () => {
  const files = {
    "package.json": {
      version: "1.0.0",
      dependencies: {
        [dep]: "github:dolomitinordicski/dns-shared-data#foundation-v1.3.0",
      },
    },
    "package-lock.json": {
      packages: {
        [`node_modules/${dep}`]: {
          version: "1.2.1",
          resolved: `git+ssh://github.com/x#${oldSha}`,
        },
      },
    },
  };
  const read = async (p) => {
    if (p.includes("/git/ref/")) return { object: { sha, type: "commit" } };
    const k = p.includes("package-lock") ? "package-lock.json" : "package.json";
    return {
      encoding: "base64",
      content: Buffer.from(JSON.stringify(files[k])).toString("base64"),
    };
  };
  const s = await snapshotAt(read, tool.repo, sha);
  assert.equal(s.foundation, null);
  assert.ok(s.errors.includes("DEPENDENCY_PIN_LOCK_MISMATCH"));
  assert.equal(s.installationVerified, false);
});
test("atomic history and no-op writes use transaction adapter only", async () => {
  const docs = new Map(),
    written = [];
  const ref = (p) => ({
    path: p,
    collection: (c) => ({ doc: (id) => ref(p + "/" + c + "/" + id) }),
  });
  const db = {
    collection: (c) => ({ doc: (id) => ref(c + "/" + id) }),
    runTransaction: async (fn) =>
      fn({
        get: async (r) => ({
          exists: docs.has(r.path),
          data: () => docs.get(r.path),
        }),
        create: (r, d) => {
          assert.ok(!docs.has(r.path));
          docs.set(r.path, d);
          written.push(r.path);
        },
        set: (r, d) => {
          docs.set(r.path, d);
          written.push(r.path);
        },
      }),
  };
  const d = projectTool(tool, observation(), null, canonical);
  assert.equal(await persistTool(db, d, "2026-11-06T22:00:00Z"), "changed");
  const n = written.length;
  assert.equal(await persistTool(db, d, "2026-11-06T22:15:00Z"), "unchanged");
  assert.equal(written.length, n);
  assert.equal(await persistTool(db, d, "2026-11-06T23:15:00Z"), "heartbeat");
});
test("invalid new production dependency does not overwrite valid prior evidence", () => {
  const o = observation();
  o.production = {
    ...source,
    foundation: null,
    errors: ["DEPENDENCY_PIN_LOCK_MISMATCH"],
  };
  const p = projectTool(
    tool,
    o,
    { observations: { production: { ...source, sha: oldSha } } },
    canonical,
  );
  assert.equal(p.observations.production.sha, oldSha);
  assert.equal(p.versions.foundation, "1.3.0");
  assert.equal(p.observations.quality, "stale");
  assert.ok(p.observations.errors.includes("DEPENDENCY_PIN_LOCK_MISMATCH"));
});
test("retired record hash ignores old derived metadata", () => {
  assert.equal(
    fingerprint({
      id: "retired",
      visible: false,
      contentHash: "old",
      lastObservedAt: "x",
    }),
    fingerprint({ id: "retired", visible: false }),
  );
});
