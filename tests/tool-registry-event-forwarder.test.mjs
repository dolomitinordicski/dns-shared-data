import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, generateKeyPairSync } from "node:crypto";
import {
  createRegistryWebhookHandler,
  createRegistryDispatcher,
  relevantEvent,
} from "../scripts/tool-registry-event-forwarder.mjs";
const secret = "synthetic-webhook-secret-for-local-tests-only",
  repository = "dolomitinordicski/analytics";
const payload = {
  ref: "refs/heads/main",
  repository: { full_name: repository, default_branch: "main" },
};
function request(
  value = payload,
  event = "push",
  id = "delivery-1",
  valid = true,
) {
  const body = JSON.stringify(value);
  return new Request("http://localhost/github/registry", {
    method: "POST",
    headers: {
      "x-github-event": event,
      "x-github-delivery": id,
      "x-hub-signature-256":
        "sha256=" +
        createHmac("sha256", valid ? secret : "wrong")
          .update(body)
          .digest("hex"),
    },
    body,
  });
}
const handler = (dispatch) =>
  createRegistryWebhookHandler({
    secret,
    repositories: [repository],
    dispatch,
  });
test("valid default-branch push wakes only central reconciliation", async () => {
  const sent = [];
  const response = await handler(async (r) => sent.push(r))(request());
  assert.equal(response.status, 202);
  assert.deepEqual(sent, [repository]);
});
test("invalid HMAC cannot trigger anything", async () => {
  let called = false;
  assert.equal(
    (
      await handler(async () => {
        called = true;
      })(request(payload, "push", "id", false))
    ).status,
    401,
  );
  assert.equal(called, false);
});
test("signed but unregistered repository is denied", async () => {
  const p = {
    ...payload,
    repository: { ...payload.repository, full_name: "attacker/repo" },
  };
  assert.equal(
    (
      await handler(async () => {
        throw Error("must not dispatch");
      })(request(p))
    ).status,
    403,
  );
});
test("feature branches, prereleases and inactive deployments do not cause loops", () => {
  assert.equal(
    relevantEvent("push", { ...payload, ref: "refs/heads/feature" }),
    false,
  );
  assert.equal(
    relevantEvent("release", {
      action: "published",
      release: { prerelease: true },
    }),
    false,
  );
  assert.equal(
    relevantEvent("deployment_status", {
      deployment_status: { state: "inactive" },
      deployment: { environment: "github-pages" },
    }),
    false,
  );
});
test("failed production deployment is forwarded too", async () => {
  let sent = false;
  const p = {
    ...payload,
    deployment_status: { state: "failure" },
    deployment: { environment: "github-pages" },
  };
  assert.equal(
    (
      await handler(async () => {
        sent = true;
      })(request(p, "deployment_status"))
    ).status,
    202,
  );
  assert.equal(sent, true);
});
test("duplicate delivery is idempotent in one instance", async () => {
  let calls = 0;
  const h = handler(async () => {
    calls++;
  });
  await h(request());
  await h(request());
  assert.equal(calls, 1);
});
test("dispatch failures expose no credential and permit redelivery", async () => {
  let calls = 0;
  const h = handler(async () => {
    if (++calls === 1) throw Error("synthetic-secret-must-not-be-returned");
  });
  const r = await h(request());
  assert.equal(r.status, 503);
  assert.ok(!(await r.text()).includes("synthetic-secret"));
  assert.equal((await h(request())).status, 202);
});
test("App token is contents-write only for central repository, versions cannot be injected", async () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const calls = [];
  const dispatch = createRegistryDispatcher({
    appId: "1",
    installationId: "2",
    privateKey,
    fetcher: async (url, args) => {
      calls.push({ url, ...args });
      return calls.length === 1
        ? Response.json({
            token: "synthetic-token",
            expires_at: new Date(Date.now() + 3600000).toISOString(),
          })
        : new Response(null, { status: 204 });
    },
  });
  await dispatch(repository);
  assert.deepEqual(JSON.parse(calls[0].body), {
    repositories: ["dns-shared-data"],
    permissions: { contents: "write" },
  });
  assert.deepEqual(JSON.parse(calls[1].body), {
    event_type: "dns-tool-registry-changed",
    client_payload: { repository },
  });
  assert.equal(
    calls[1].url,
    "https://api.github.com/repos/dolomitinordicski/dns-shared-data/dispatches",
  );
});
