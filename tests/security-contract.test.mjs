import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
const aiRoute = await readFile(new URL("../app/api/ai-quote/route.ts", import.meta.url), "utf8");
const firebaseClient = await readFile(new URL("../lib/firebase/client.ts", import.meta.url), "utf8");

test("Firestore rules retain organization isolation and deny unknown paths", () => {
  assert.match(rules, /resource\.data\.organizationId == organizationId\(\)/);
  assert.match(rules, /request\.resource\.data\.organizationId == organizationId\(\)/);
  assert.match(rules, /match \/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);
  assert.doesNotMatch(rules, /allow read, write: if true/);
});

test("new user profiles require an owner role and email verification flag", () => {
  assert.match(rules, /request\.resource\.data\.role == 'owner'/);
  assert.match(rules, /request\.resource\.data\.emailVerificationRequired == true/);
  assert.match(rules, /request\.resource\.data\.role == resource\.data\.role/);
});

test("team invitations stay email-bound, expiring, and cannot grant owner", () => {
  assert.match(rules, /match \/invitations\/\{invitationId\}/);
  assert.match(rules, /request\.auth\.token\.email == resource\.data\.email/);
  assert.match(rules, /request\.auth\.token\.email == request\.resource\.data\.email/);
  assert.match(rules, /request\.resource\.data\.role in \['admin', 'member', 'viewer'\]/);
  assert.match(rules, /request\.time < resource\.data\.expiresAt/);
  assert.match(rules, /request\.resource\.data\.status == 'active'/);
});

test("only the owner can change another member while preserving organization identity", () => {
  assert.match(rules, /isOwner\(\)/);
  assert.match(rules, /userId != request\.auth\.uid/);
  assert.match(rules, /resource\.data\.role != 'owner'/);
  assert.match(rules, /request\.resource\.data\.organizationId == resource\.data\.organizationId/);
  assert.match(rules, /request\.resource\.data\.status in \['active', 'disabled'\]/);
});

test("OpenAI key stays server-side", () => {
  assert.match(aiRoute, /process\.env\.OPENAI_API_KEY/);
  assert.doesNotMatch(firebaseClient, /OPENAI_API_KEY/);
  assert.doesNotMatch(aiRoute, /NEXT_PUBLIC_OPENAI/);
});
