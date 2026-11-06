import { createHmac, timingSafeEqual, createSign } from "node:crypto";

export function relevantEvent(event, payload) {
  if (event === "push")
    return (
      !payload.deleted &&
      payload.ref === `refs/heads/${payload.repository?.default_branch}`
    );
  if (event === "release")
    return (
      payload.action === "published" &&
      !payload.release?.draft &&
      !payload.release?.prerelease
    );
  if (event === "deployment_status")
    return (
      ["success", "failure", "error"].includes(
        payload.deployment_status?.state,
      ) &&
      ["github-pages", "production"].includes(
        payload.deployment?.environment,
      ) &&
      !payload.deployment?.transient_environment
    );
  return false;
}

/** Verify raw bytes before parsing. This receiver cannot write Firebase or trust supplied version metadata. */
export function createRegistryWebhookHandler({
  secret,
  repositories,
  dispatch,
  now = () => Date.now(),
}) {
  if (typeof secret !== "string" || secret.length < 32)
    throw Error("REGISTRY_WEBHOOK_SECRET_REQUIRED");
  const seen = new Map();
  return async (request) => {
    const reply = (status, result) => Response.json({ result }, { status });
    if (
      request.method !== "POST" ||
      new URL(request.url).pathname !== "/github/registry"
    )
      return reply(404, "not-found");
    const reader = request.body?.getReader();
    if (!reader) return reply(400, "missing-body");
    const chunks = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1048576) {
        await reader.cancel();
        return reply(413, "payload-too-large");
      }
      chunks.push(Buffer.from(value));
    }
    const body = Buffer.concat(chunks),
      signature = request.headers.get("x-hub-signature-256") ?? "";
    if (!/^sha256=[a-f0-9]{64}$/.test(signature))
      return reply(401, "invalid-signature");
    const expected = createHmac("sha256", secret).update(body).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), "hex")))
      return reply(401, "invalid-signature");
    let payload;
    try {
      payload = JSON.parse(body.toString("utf8"));
    } catch {
      return reply(400, "invalid-json");
    }
    const repository = payload.repository?.full_name;
    if (!repositories.includes(repository))
      return reply(403, "repository-not-allowlisted");
    const event = request.headers.get("x-github-event");
    if (!relevantEvent(event, payload)) return reply(202, "ignored");
    const delivery = request.headers.get("x-github-delivery");
    if (!delivery || delivery.length > 100)
      return reply(400, "missing-delivery-id");
    for (const [id, time] of seen) if (now() - time > 600000) seen.delete(id);
    if (seen.has(delivery)) return reply(202, "duplicate");
    // Mark before awaiting; duplicate deliveries cannot issue parallel dispatches in this process.
    if (seen.size >= 10000) return reply(503, "retry-later");
    seen.set(delivery, now());
    try {
      await dispatch(repository);
      return reply(202, "dispatched");
    } catch {
      seen.delete(delivery);
      return reply(503, "dispatch-unavailable");
    }
  };
}

/** Installation token is restricted to contents:write on the central repository only. */
export function createRegistryDispatcher({
  appId,
  installationId,
  privateKey,
  fetcher = fetch,
}) {
  if (!/^\d+$/.test(String(appId)) || !/^\d+$/.test(String(installationId)))
    throw Error("REGISTRY_APP_CONFIGURATION_REQUIRED");
  let cached = null;
  async function token() {
    if (cached && cached.expires > Date.now() + 60000) return cached.value;
    const now = Math.floor(Date.now() / 1000),
      encode = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const body = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iat: now - 60, exp: now + 480, iss: String(appId) })}`;
    const signature = createSign("RSA-SHA256")
      .update(body)
      .sign(privateKey)
      .toString("base64url");
    const r = await fetcher(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${body}.${signature}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositories: ["dns-shared-data"],
          permissions: { contents: "write" },
        }),
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      },
    );
    if (!r.ok) throw Error("REGISTRY_TOKEN_UNAVAILABLE");
    const result = await r.json();
    if (
      typeof result.token !== "string" ||
      !Number.isFinite(Date.parse(result.expires_at))
    )
      throw Error("REGISTRY_TOKEN_INVALID");
    cached = { value: result.token, expires: Date.parse(result.expires_at) };
    return cached.value;
  }
  return async (repository) => {
    const r = await fetcher(
      "https://api.github.com/repos/dolomitinordicski/dns-shared-data/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await token()}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "dns-tool-registry-changed",
          client_payload: { repository },
        }),
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      },
    );
    if (r.status !== 204) throw Error("REGISTRY_DISPATCH_UNAVAILABLE");
  };
}
