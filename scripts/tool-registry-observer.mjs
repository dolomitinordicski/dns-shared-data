import { createHash } from "node:crypto";
const SHARED = "dolomitinordicski/dns-shared-data",
  DEP = "@dolomitinordicski/dns-shared-data",
  SHA = /^[a-f0-9]{40}$/;
export const semver = (v) =>
  typeof v === "string" && /^\d+\.\d+\.\d+$/.test(v) ? v : null;
export function compareVersions(a, b) {
  if (!semver(a) || !semver(b)) return null;
  const x = a.split(".").map(Number),
    y = b.split(".").map(Number);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}
export function versionState(a, b) {
  const n = compareVersions(a, b);
  return n === null
    ? "unknown"
    : n < 0
      ? "update-available"
      : n > 0
        ? "ahead"
        : "up-to-date";
}
export function lockDependency(pkg, lock) {
  const pin = pkg?.dependencies?.[DEP] ?? pkg?.devDependencies?.[DEP] ?? null;
  const entry =
    lock?.packages?.[`node_modules/${DEP}`] ?? lock?.dependencies?.[DEP];
  return {
    pin,
    tag:
      typeof pin === "string"
        ? (pin.match(
            /^github:dolomitinordicski\/dns-shared-data#(foundation-v\d+\.\d+\.\d+)$/,
          )?.[1] ?? null)
        : null,
    sha: entry?.resolved?.match(/#([a-f0-9]{40})$/)?.[1] ?? null,
    packageVersion: semver(entry?.version),
  };
}
export function fingerprint(value) {
  const normalize = (v) =>
    Array.isArray(v)
      ? v.map(normalize)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .filter(
                (k) =>
                  ![
                    "checkedAt",
                    "observedAt",
                    "syncedAt",
                    "lastSuccessAt",
                    "lastObservedAt",
                    "firstObservedAt",
                    "contentHash",
                  ].includes(k),
              )
              .map((k) => [k, normalize(v[k])]),
          )
        : v;
  return createHash("sha256")
    .update(JSON.stringify(normalize(value)))
    .digest("hex");
}
// A dispatch is only a wake-up signal. It never supplies authoritative versions or URLs.
export function validateSignal(payload, repos) {
  if (!payload || !repos.includes(payload.repository))
    throw Error("UNTRUSTED_REGISTRY_SIGNAL");
  return payload.repository;
}
export function createGitHubReader(token, fetcher = fetch) {
  const cache = new Map();
  return async (path) => {
    if (!path.startsWith("/repos/dolomitinordicski/") || path.includes(".."))
      throw Error("UNTRUSTED_GITHUB_PATH");
    if (!cache.has(path))
      cache.set(
        path,
        (async () => {
          const r = await fetcher(`https://api.github.com${path}`, {
            headers: {
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: AbortSignal.timeout(15000),
            redirect: "error",
          });
          if (r.status === 404) return null;
          if (!r.ok) throw Error(`GITHUB_${r.status}`);
          return r.json();
        })(),
      );
    return cache.get(path);
  };
}
export async function readFile(read, repo, path, sha) {
  if (!SHA.test(sha)) throw Error("IMMUTABLE_SHA_REQUIRED");
  const f = await read(`/repos/${repo}/contents/${path}?ref=${sha}`);
  if (!f) return null;
  if (f.encoding !== "base64" || f.size > 2000000)
    throw Error("UNSUPPORTED_SOURCE_FILE");
  return Buffer.from(f.content, "base64").toString("utf8");
}
export async function tagCommit(read, repo, tag) {
  let o = (await read(`/repos/${repo}/git/ref/tags/${encodeURIComponent(tag)}`))
    ?.object;
  for (let i = 0; o?.type === "tag" && i < 4; i++)
    o = (await read(`/repos/${repo}/git/tags/${o.sha}`))?.object;
  return o?.type === "commit" && SHA.test(o.sha) ? o.sha : null;
}
const exportedVersion = (s, n) =>
  semver(s?.match(new RegExp(`${n}\\s*=\\s*['\"]([^'\"]+)['\"]`))?.[1]);
export async function snapshotAt(read, repo, sha) {
  const raw = await readFile(read, repo, "package.json", sha),
    pkg = raw ? JSON.parse(raw) : null;
  const lock = await readFile(read, repo, "package-lock.json", sha),
    dependency = lockDependency(pkg, lock ? JSON.parse(lock) : null);
  let foundation = null,
    designSystem = null,
    sharedData = dependency.packageVersion;
  const errors = [];
  if (repo === SHARED) {
    foundation = exportedVersion(
      await readFile(read, repo, "src/version.ts", sha),
      "DNS_FOUNDATION_RELEASE_VERSION",
    );
    designSystem = exportedVersion(
      await readFile(read, repo, "src/design-system.ts", sha),
      "DNS_DESIGN_SYSTEM_VERSION",
    );
    sharedData = semver(pkg?.version);
  } else if (dependency.sha) {
    const expected = dependency.tag
      ? await tagCommit(read, SHARED, dependency.tag)
      : null;
    if (!expected || expected !== dependency.sha)
      errors.push("DEPENDENCY_PIN_LOCK_MISMATCH");
    else {
      foundation = exportedVersion(
        await readFile(read, SHARED, "src/version.ts", dependency.sha),
        "DNS_FOUNDATION_RELEASE_VERSION",
      );
      designSystem = exportedVersion(
        await readFile(read, SHARED, "src/design-system.ts", dependency.sha),
        "DNS_DESIGN_SYSTEM_VERSION",
      );
    }
  } else if (dependency.pin) errors.push("LOCKFILE_EVIDENCE_MISSING");
  return {
    sha,
    app: semver(pkg?.version),
    foundation,
    designSystem,
    sharedData,
    dependency,
    evidence: dependency.sha
      ? "lockfile-at-commit"
      : pkg
        ? "source-at-commit"
        : "unavailable",
    installationVerified: false,
    runtimeUsage: "unknown",
    errors,
  };
}
export async function availableRelease(read) {
  const releases = await read(`/repos/${SHARED}/releases?per_page=100`);
  if (!Array.isArray(releases)) throw Error("RELEASE_DISCOVERY_UNAVAILABLE");
  const stable = releases.filter(
    (r) =>
      !r.draft &&
      !r.prerelease &&
      /^foundation-v\d+\.\d+\.\d+$/.test(r.tag_name),
  );
  stable.sort(
    (a, b) => compareVersions(b.tag_name.slice(12), a.tag_name.slice(12)) ?? 0,
  );
  if (!stable[0]) throw Error("STABLE_RELEASE_UNAVAILABLE");
  const r = stable[0],
    sha = await tagCommit(read, SHARED, r.tag_name);
  if (!sha) throw Error("RELEASE_SHA_UNAVAILABLE");
  const s = await snapshotAt(read, SHARED, sha);
  if (
    !s.foundation ||
    !s.designSystem ||
    !s.sharedData ||
    s.foundation !== r.tag_name.slice(12)
  )
    throw Error("CANONICAL_COMPONENT_EVIDENCE_MISSING");
  return {
    foundation: { version: s.foundation, ref: r.tag_name },
    designSystem: { version: s.designSystem },
    sharedData: { version: s.sharedData },
    release: {
      tag: r.tag_name,
      sha,
      publishedAt: r.published_at,
      url: r.html_url,
    },
  };
}
// Successful CI is not deployment evidence. Only production deployment statuses are used.
export async function deploymentEvidence(
  read,
  repo,
  environment = "github-pages",
) {
  const deployments = await read(
    `/repos/${repo}/deployments?environment=${encodeURIComponent(environment)}&per_page=100`,
  );
  if (!Array.isArray(deployments))
    return { latest: null, successful: null, complete: false };
  let latest = null,
    successful = null;
  for (const d of deployments) {
    if (
      d.environment !== environment ||
      !SHA.test(d.sha) ||
      d.transient_environment
    )
      continue;
    const statuses = await read(
      `/repos/${repo}/deployments/${d.id}/statuses?per_page=100`,
    );
    if (!statuses?.length) continue;
    const s = statuses[0],
      e = {
        id: d.id,
        sha: d.sha,
        environment,
        state: s.state,
        updatedAt: s.updated_at,
        url: s.environment_url ?? null,
        logUrl: s.log_url ?? null,
      };
    latest ??= e;
    if (s.state === "success") {
      successful = e;
      break;
    }
  }
  return {
    latest,
    successful,
    complete: deployments.length < 100 || !!successful,
  };
}
export async function observeTool(
  tool,
  read,
  probe,
  now = new Date().toISOString(),
) {
  const errors = [],
    o = {
      observedAt: now,
      main: null,
      production: null,
      deployment: null,
      release: null,
      errors,
    };
  if (tool.repo) {
    try {
      const r = await read(`/repos/${tool.repo}`);
      if (!r) throw Error("REPOSITORY_UNAVAILABLE");
      const b = await read(
        `/repos/${tool.repo}/branches/${encodeURIComponent(r.default_branch)}`,
      );
      if (!b?.commit?.sha) throw Error("MAIN_SHA_UNAVAILABLE");
      o.main = await snapshotAt(read, tool.repo, b.commit.sha);
    } catch (e) {
      errors.push(`MAIN_${e.message}`);
    }
    try {
      o.deployment = await deploymentEvidence(
        read,
        tool.repo,
        tool.deploymentEnvironment ?? "github-pages",
      );
      if (o.deployment.successful)
        o.production = await snapshotAt(
          read,
          tool.repo,
          o.deployment.successful.sha,
        );
      if (!o.production) errors.push("PRODUCTION_EVIDENCE_UNAVAILABLE");
      if (!o.deployment.complete) errors.push("DEPLOYMENT_HISTORY_TRUNCATED");
    } catch (e) {
      errors.push(`DEPLOYMENT_${e.message}`);
    }
    try {
      const releases = await read(`/repos/${tool.repo}/releases?per_page=10`),
        r = releases?.find((r) => !r.draft && !r.prerelease);
      if (r)
        o.release = {
          tag: r.tag_name,
          sha: await tagCommit(read, tool.repo, r.tag_name),
          publishedAt: r.published_at,
          url: r.html_url,
        };
    } catch (e) {
      errors.push(`RELEASE_${e.message}`);
    }
  }
  o.web = await probe(tool.url);
  return o;
}
export function projectTool(tool, o, previous, canonical) {
  const preserved = [];
  const keep = (k, v) => {
    if (
      v !== null &&
      v !== undefined &&
      !(k === "production" && v.errors?.length)
    )
      return v;
    if (previous?.observations?.[k]) {
      preserved.push(k);
      return previous.observations[k];
    }
    return v ?? null;
  };
  const main = keep("main", o.main),
    production = keep("production", o.production),
    deployment = keep("deployment", o.deployment),
    release = keep("release", o.release),
    versions = {};
  for (const k of ["app", "foundation", "designSystem", "sharedData"])
    versions[k] = production?.[k] ?? null;
  versions.foundationPin = production?.dependency?.pin ?? null;
  versions.canonical = canonical;
  versions.state = Object.fromEntries(
    ["foundation", "designSystem", "sharedData"].map((k) => [
      k,
      versionState(versions[k], canonical?.[k]?.version),
    ]),
  );
  versions.updateRequired = Object.values(versions.state).includes(
    "update-available",
  );
  const errors = [
    ...o.errors,
    ...(o.main?.errors ?? []),
    ...(o.production?.errors ?? []),
  ];
  return {
    ...tool,
    registryVersion: "2.0.0",
    recordType: "tool",
    versions,
    observations: {
      main,
      production,
      deployment,
      release,
      observedAt: o.observedAt,
      lastSuccessAt:
        errors.length || preserved.length
          ? (previous?.observations?.lastSuccessAt ?? null)
          : o.observedAt,
      quality: errors.length || preserved.length ? "stale" : "verified",
      preserved,
      errors,
      sourceDiffersFromProduction:
        main?.sha && production?.sha ? main.sha !== production.sha : null,
    },
    health: {
      web: o.web,
      firebase: {
        state: tool.backend.kind === "none" ? "na" : "pending",
        reason: "per-tool-service-probe-not-configured",
      },
      connectivity:
        o.web.state === "offline"
          ? "offline"
          : o.web.state === "active" && tool.backend.kind === "none"
            ? "active"
            : "pending",
      checkedAt: o.observedAt,
    },
  };
}
export async function persistTool(db, document, observedAt) {
  const ref = db.collection("toolRegistryPublic").doc(document.id);
  return db.runTransaction(async (tx) => {
    const s = await tx.get(ref),
      prior = s.exists ? s.data() : null,
      hash = fingerprint(document);
    if (
      prior?.contentHash === hash &&
      Date.parse(observedAt) - Date.parse(prior.lastObservedAt ?? "") < 3600000
    )
      return "unchanged";
    if (prior?.contentHash !== hash) {
      const h = ref
          .collection("observations")
          .doc(observedAt.replace(/[^0-9TZ]/g, "") + "_" + hash),
        old = await tx.get(h);
      if (!old.exists)
        tx.create(h, {
          ...document,
          contentHash: hash,
          firstObservedAt: observedAt,
        });
    }
    tx.set(ref, { ...document, contentHash: hash, lastObservedAt: observedAt });
    return prior?.contentHash === hash ? "heartbeat" : "changed";
  });
}
