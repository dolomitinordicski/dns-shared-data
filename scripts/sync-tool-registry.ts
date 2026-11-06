import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DNS_TOOL_REGISTRY } from "../src/tool-registry.js";
import {
  availableRelease,
  createGitHubReader,
  observeTool,
  projectTool,
  persistTool,
  validateSignal,
} from "./tool-registry-observer.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
async function probe(url: string | null) {
  if (!url) return { state: "na", reason: "no-public-url" };
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    return {
      state: r.ok ? "active" : "offline",
      httpStatus: r.status,
      reason: "http-only-not-service-validation",
    };
  } catch {
    return { state: "offline", reason: "web-probe-failed" };
  }
}
async function main() {
  if (process.env.GITHUB_EVENT_NAME === "repository_dispatch") {
    const event = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH!, "utf8"),
    );
    validateSignal(
      event.client_payload,
      DNS_TOOL_REGISTRY.flatMap((t) => (t.repo ? [t.repo] : [])),
    );
  }
  const read = createGitHubReader(process.env.GH_REGISTRY_TOKEN),
    canonical = await availableRelease(read),
    observedAt = new Date().toISOString(),
    observations = [];
  for (const tool of DNS_TOOL_REGISTRY)
    observations.push({
      tool,
      value: await observeTool(tool, read, probe, observedAt),
    });
  // Dry run never initializes Firebase and needs no production credentials.
  if (!APPLY) {
    const report = {
      mode: "DRY_RUN",
      observedAt,
      canonical,
      tools: observations.map(({ tool, value }) =>
        projectTool(tool, value, null, canonical),
      ),
    };
    const out = process.argv.indexOf("--output");
    if (out >= 0)
      writeFileSync(process.argv[out + 1], JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  if (
    process.env.GITHUB_REF !== "refs/heads/main" ||
    process.env.REGISTRY_APPLY_ENABLED !== "true"
  )
    throw Error("REGISTRY_APPLY_NOT_AUTHORIZED");
  initializeApp({ credential: applicationDefault(), projectId: "dns-core" });
  const db = getFirestore(),
    old = await db.collection("toolRegistryPublic").get(),
    previous = new Map(old.docs.map((d) => [d.id, d.data()]));
  let changed = 0;
  for (const { tool, value } of observations) {
    const doc = projectTool(tool, value, previous.get(tool.id), canonical);
    if ((await persistTool(db, doc, observedAt)) === "changed") changed++;
    previous.delete(tool.id);
  }
  for (const [id, value] of previous)
    if (
      id !== "_meta" &&
      (value.recordType === "tool" || value.registryVersion)
    )
      await persistTool(
        db,
        { ...value, id, visible: false, retired: true, recordType: "tool" },
        observedAt,
      );
  await db
    .collection("toolRegistryPublic")
    .doc("_meta")
    .set({
      id: "_meta",
      registryVersion: "2.0.0",
      canonical,
      checkedAt: observedAt,
      changed,
    });
  console.log(
    JSON.stringify({
      mode: "APPLY",
      observedAt,
      changed,
      tools: observations.length,
    }),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
