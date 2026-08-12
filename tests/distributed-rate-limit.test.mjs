import assert from "node:assert/strict";
import test from "node:test";
import { consumeDistributedRateLimit } from "../lib/firebase/server-rest.ts";

test("distributed limiter shares one Firestore bucket across independent calls", async (context) => {
  const originalFetch = globalThis.fetch;
  let stored = null;
  let revision = 0;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (url, init = {}) => {
    const method = init.method ?? "GET";
    if (method === "GET") {
      if (!stored) return new Response("{}", { status: 404 });
      return Response.json({ fields: stored, updateTime: `2026-08-12T00:00:0${revision}.000000Z` });
    }
    if (method === "POST") {
      if (stored) return new Response("{}", { status: 409 });
      stored = JSON.parse(init.body).fields;
      revision += 1;
      return Response.json({ fields: stored, updateTime: `2026-08-12T00:00:0${revision}.000000Z` });
    }
    if (method === "PATCH") {
      const expected = new URL(url).searchParams.get("currentDocument.updateTime");
      if (expected !== `2026-08-12T00:00:0${revision}.000000Z`) return new Response("{}", { status: 412 });
      stored = JSON.parse(init.body).fields;
      revision += 1;
      return Response.json({ fields: stored, updateTime: `2026-08-12T00:00:0${revision}.000000Z` });
    }
    return new Response("{}", { status: 405 });
  };
  const input = { base: "https://firestore.example/documents", projectId: "project", uid: "user-1", organizationId: "org-1", idToken: "not-logged", scope: "ai-quote", limit: 2, windowMs: 60_000 };
  assert.equal((await consumeDistributedRateLimit(input)).allowed, true);
  assert.equal((await consumeDistributedRateLimit(input)).allowed, true);
  const blocked = await consumeDistributedRateLimit(input);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(JSON.stringify(stored).includes("not-logged"), false);
});
