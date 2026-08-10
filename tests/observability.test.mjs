import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeClientError } from "../lib/observability.ts";

test("client error telemetry drops messages, stacks, queries, and unknown fields", () => {
  const result = sanitizeClientError({
    type: "TypeError<script>",
    path: "/teklifler?customer=secret#detail",
    digest: "digest-123",
    message: "customer@example.com",
    stack: "private stack",
    userId: "private-user",
  });
  assert.deepEqual(result, {
    type: "TypeErrorscript",
    path: "/teklifler",
    digest: "digest-123",
  });
  assert.equal("message" in result, false);
  assert.equal("stack" in result, false);
  assert.equal("userId" in result, false);
});

test("client error telemetry safely handles malformed input", () => {
  assert.deepEqual(sanitizeClientError(null), { type: "ApplicationError", path: "/" });
  assert.deepEqual(sanitizeClientError({ path: "https://example.com/private" }), {
    type: "ApplicationError",
    path: "/",
  });
});
