import { createServer } from "node:http";
import { DNS_TOOL_REGISTRY } from "../src/tool-registry.js";
import {
  createRegistryWebhookHandler,
  createRegistryDispatcher,
} from "./tool-registry-event-forwarder.mjs";

const dispatch = createRegistryDispatcher({
  appId: process.env.REGISTRY_APP_ID!,
  installationId: process.env.REGISTRY_INSTALLATION_ID!,
  privateKey: process.env.REGISTRY_APP_PRIVATE_KEY!,
});
const handle = createRegistryWebhookHandler({
  secret: process.env.REGISTRY_WEBHOOK_SECRET!,
  repositories: DNS_TOOL_REGISTRY.flatMap((t) => (t.repo ? [t.repo] : [])),
  dispatch,
});
// An HTTPS reverse proxy is mandatory in production. This process has no Firebase credentials.
createServer(async (req, res) => {
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 1048576) {
        res.writeHead(413).end();
        return;
      }
      chunks.push(chunk);
    }
    const request = new Request("http://localhost" + (req.url ?? "/"), {
      method: req.method,
      headers: req.headers as HeadersInit,
      ...(req.method === "POST" ? { body: Buffer.concat(chunks) } : {}),
    });
    const response = await handle(request);
    res
      .writeHead(response.status, { "Content-Type": "application/json" })
      .end(await response.text());
  } catch {
    res.writeHead(500).end('{"result":"unavailable"}');
  }
}).listen(Number(process.env.PORT ?? 8080), "0.0.0.0");
