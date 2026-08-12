import assert from "node:assert/strict";
import test from "node:test";
import { clearRateLimitsForTesting, consumeRateLimit, requestRateLimitKey } from "../lib/rate-limit.ts";

test("rate limiter blocks only after the configured request budget", () => {
  clearRateLimitsForTesting();
  assert.equal(consumeRateLimit("ai:user", { limit: 2, windowMs: 60_000, now: 1_000 }).allowed, true);
  assert.equal(consumeRateLimit("ai:user", { limit: 2, windowMs: 60_000, now: 1_001 }).allowed, true);
  const blocked = consumeRateLimit("ai:user", { limit: 2, windowMs: 60_000, now: 1_002 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.retryAfterSeconds, 60);
});

test("rate limit window resets and identifiers are hashed", async () => {
  clearRateLimitsForTesting();
  consumeRateLimit("ai:user", { limit: 1, windowMs: 100, now: 1_000 });
  assert.equal(consumeRateLimit("ai:user", { limit: 1, windowMs: 100, now: 1_101 }).allowed, true);
  const request = new Request("https://example.com/api/ai-quote", {
    headers: { authorization: "Bearer sensitive-token" },
  });
  const key = await requestRateLimitKey(request, "ai-quote");
  assert.match(key, /^ai-quote:[0-9a-f]{64}$/);
  assert.equal(key.includes("sensitive-token"), false);
});
