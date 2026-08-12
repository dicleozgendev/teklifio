import assert from "node:assert/strict";
import test from "node:test";
import { resolveRuntimeFlags } from "../lib/runtime-config.ts";

test("demo banner and demo data seeding are independent", () => {
  const flags = resolveRuntimeFlags({ demoMode: "true", seedDemoData: "false", appEnvironment: "staging" });
  assert.equal(flags.demoMode, true);
  assert.equal(flags.seedDemoData, false);
});

test("production never seeds fictional workspace data", () => {
  const flags = resolveRuntimeFlags({ demoMode: "true", seedDemoData: "true", appEnvironment: "production" });
  assert.equal(flags.demoMode, true);
  assert.equal(flags.seedDemoData, false);
});

test("explicit demo seeding is available only outside production", () => {
  assert.equal(resolveRuntimeFlags({ seedDemoData: "true", appEnvironment: "staging" }).seedDemoData, true);
  assert.equal(resolveRuntimeFlags({ seedDemoData: "true", appEnvironment: "development" }).seedDemoData, true);
});

test("public signup can be disabled independently for controlled demos", () => {
  const flags = resolveRuntimeFlags({ demoMode: "true", appEnvironment: "production", publicSignup: "false" });
  assert.equal(flags.publicSignup, false);
  assert.equal(flags.demoMode, true);
});
