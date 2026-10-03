import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  DNS_TOOL_REGISTRY,
  DNS_TOOL_REGISTRY_CANONICAL,
  DNS_TOOL_REGISTRY_VERSION,
} from '../src/tool-registry.js';

const APPLY = process.argv.includes('--apply');
const PROJECT_ID = 'dns-core';
const COLLECTION = 'toolRegistryPublic';
const META_DOC = '_meta';

type ParsedSemver = { raw: string; major: number; minor: number; patch: number };
type ProbeState = 'active' | 'pending' | 'offline' | 'na';
type ProbeResult = { state: ProbeState; reason?: string; httpStatus?: number };
type PackageJsonShape = {
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function parseSemver(value: unknown): ParsedSemver | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    raw: `${match[1]}.${match[2]}.${match[3]}`,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareSemver(a: ParsedSemver | null, b: ParsedSemver | null) {
  if (!a || !b) return 0;
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

async function fetchText(url: string, timeoutMs = 8000) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'user-agent': 'dns-shared-data-tool-registry/1.0' },
  });
  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }
  return response.text();
}

async function probeWeb(url: string | null): Promise<ProbeResult> {
  if (!url) return { state: 'na', reason: 'no-public-url' };
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: { 'user-agent': 'dns-shared-data-health/1.0' },
    });
    return response.ok
      ? { state: 'active', httpStatus: response.status }
      : { state: 'offline', httpStatus: response.status, reason: 'http-error' };
  } catch (error) {
    return {
      state: 'offline',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function readRepoPackage(repo: string | null): Promise<PackageJsonShape | null> {
  if (!repo) return null;
  try {
    const raw = await fetchText(
      `https://raw.githubusercontent.com/${repo}/main/package.json`,
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function resolveFoundationVersions(packageJson: PackageJsonShape | null) {
  const pin =
    packageJson?.dependencies?.['@dolomitinordicski/dns-shared-data'] ??
    packageJson?.devDependencies?.['@dolomitinordicski/dns-shared-data'] ??
    null;

  const foundation = parseSemver(pin);
  let designSystem = null;

  if (foundation) {
    try {
      const designSource = await fetchText(
        `https://raw.githubusercontent.com/dolomitinordicski/dns-shared-data/foundation-v${foundation.raw}/src/design-system.ts`,
      );
      const match = designSource.match(
        /DNS_DESIGN_SYSTEM_VERSION\s*=\s*['"]([^'"]+)['"]/,
      );
      designSystem = parseSemver(match?.[1] ?? null);
    } catch {
      designSystem = null;
    }
  }

  return {
    foundationPin: typeof pin === 'string' ? pin : null,
    foundation: foundation?.raw ?? null,
    designSystem: designSystem?.raw ?? null,
    sharedData: foundation?.raw ?? null,
  };
}

function versionState(current: string | null, canonical: string) {
  const a = parseSemver(current);
  const b = parseSemver(canonical);
  if (!a || !b) return 'unknown';
  const comparison = compareSemver(a, b);
  if (comparison === 0) return 'up-to-date';
  if (comparison < 0) return 'update-available';
  return 'ahead';
}

function aggregateConnectivity(web: ProbeResult, firebase: ProbeResult): ProbeState {
  if (web.state === 'offline' || firebase.state === 'offline') return 'offline';
  if (web.state === 'pending' || firebase.state === 'pending') return 'pending';
  if (web.state === 'active' && (firebase.state === 'active' || firebase.state === 'na')) {
    return 'active';
  }
  if (web.state === 'na' && firebase.state === 'active') return 'active';
  return 'pending';
}

async function main() {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  let dnsCoreProbe: ProbeResult = { state: 'pending', reason: 'not-checked' };
  try {
    await db.collection('seasons').limit(1).get();
    dnsCoreProbe = { state: 'active' };
  } catch (error) {
    dnsCoreProbe = {
      state: 'offline',
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  const checkedAt = new Date().toISOString();
  const documents = [];

  for (const tool of DNS_TOOL_REGISTRY) {
    const packageJson = await readRepoPackage(tool.repo);
    let versions = await resolveFoundationVersions(packageJson);

    if (tool.id === 'hub' || tool.id === 'shared-data') {
      versions = {
        foundationPin:
          tool.id === 'hub'
            ? 'web-runtime:canonical'
            : DNS_TOOL_REGISTRY_CANONICAL.foundation.ref,
        foundation: DNS_TOOL_REGISTRY_CANONICAL.foundation.version,
        designSystem: DNS_TOOL_REGISTRY_CANONICAL.designSystem.version,
        sharedData: DNS_TOOL_REGISTRY_CANONICAL.sharedData.version,
      };
    }

    if (tool.id === 'dns-core') {
      versions = {
        foundationPin: null,
        foundation: null,
        designSystem: null,
        sharedData: null,
      };
    }

    const web = await probeWeb(tool.url);

    let firebase: ProbeResult;
    switch (tool.backend.kind) {
      case 'dns-core':
        firebase = dnsCoreProbe;
        break;
      case 'none':
        firebase = { state: 'na', reason: 'no-firebase' };
        break;
      case 'fair-modell':
      case 'polls-private':
      case 'app-specific':
        firebase = {
          state: 'pending',
          reason: 'separate-backend-probe-not-configured',
        };
        break;
      default:
        firebase = { state: 'pending', reason: 'unknown-backend' };
    }

    const foundationState =
      tool.id === 'dns-core'
        ? 'na'
        : tool.id === 'shared-data'
          ? 'up-to-date'
          : versionState(
            versions.foundation,
            DNS_TOOL_REGISTRY_CANONICAL.foundation.version,
          );
    const designSystemState =
      tool.id === 'dns-core'
        ? 'na'
        : tool.id === 'shared-data'
          ? 'up-to-date'
          : versionState(
            versions.designSystem,
            DNS_TOOL_REGISTRY_CANONICAL.designSystem.version,
          );
    const sharedDataState =
      tool.id === 'dns-core'
        ? 'na'
        : tool.id === 'shared-data'
          ? 'up-to-date'
          : versionState(
            versions.sharedData,
            DNS_TOOL_REGISTRY_CANONICAL.sharedData.version,
          );

    const updateRequired = [
      foundationState,
      designSystemState,
      sharedDataState,
    ].some((state) => state === 'update-available');

    const doc = {
      ...tool,
      registryVersion: DNS_TOOL_REGISTRY_VERSION,
      versions: {
        app: packageJson?.version ?? null,
        foundation: versions.foundation,
        designSystem: versions.designSystem,
        sharedData: versions.sharedData,
        foundationPin: versions.foundationPin,
        canonical: DNS_TOOL_REGISTRY_CANONICAL,
        state: {
          foundation: foundationState,
          designSystem: designSystemState,
          sharedData: sharedDataState,
        },
        updateRequired,
      },
      health: {
        connectivity: aggregateConnectivity(web, firebase),
        web,
        firebase,
        checkedAt,
      },
    };

    documents.push(doc);
  }

  const summary = {
    tools: documents.filter((tool) => tool.visible).length,
    active: documents.filter((tool) => tool.health.connectivity === 'active').length,
    pending: documents.filter((tool) => tool.health.connectivity === 'pending').length,
    offline: documents.filter((tool) => tool.health.connectivity === 'offline').length,
    updatesRequired: documents.filter((tool) => tool.versions.updateRequired).length,
  };

  console.log(JSON.stringify({
    mode: APPLY ? 'APPLY' : 'DRY_RUN',
    checkedAt,
    canonical: DNS_TOOL_REGISTRY_CANONICAL,
    summary,
    tools: documents.map((tool) => ({
      id: tool.id,
      lifecycle: tool.lifecycle,
      connectivity: tool.health.connectivity,
      foundation: tool.versions.foundation,
      designSystem: tool.versions.designSystem,
      updateRequired: tool.versions.updateRequired,
    })),
  }, null, 2));

  if (!APPLY) return;

  const batch = db.batch();
  for (const document of documents) {
    batch.set(db.collection(COLLECTION).doc(document.id), {
      ...document,
      syncedAt: FieldValue.serverTimestamp(),
    });
  }
  batch.set(db.collection(COLLECTION).doc(META_DOC), {
    id: META_DOC,
    registryVersion: DNS_TOOL_REGISTRY_VERSION,
    canonical: DNS_TOOL_REGISTRY_CANONICAL,
    summary,
    checkedAt,
    syncedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  console.log(`✓ ${documents.length} tool registry documents synchronized to DNS Core.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
