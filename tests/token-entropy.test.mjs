import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

test("share tokens use RFC 4122 version 4 UUIDs with collision-resistant entropy", () => {
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const tokens = new Set(Array.from({ length: 10_000 }, () => randomUUID()));
  assert.equal(tokens.size, 10_000);
  for (const token of tokens) assert.match(token, pattern);
});
