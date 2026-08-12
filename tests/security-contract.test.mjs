import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
const aiRoute = await readFile(new URL("../app/api/ai-quote/route.ts", import.meta.url), "utf8");
const clientErrorRoute = await readFile(new URL("../app/api/client-error/route.ts", import.meta.url), "utf8");
const firebaseClient = await readFile(new URL("../lib/firebase/client.ts", import.meta.url), "utf8");
const firebaseAuth = await readFile(new URL("../lib/firebase/auth.ts", import.meta.url), "utf8");
const serverRest = await readFile(new URL("../lib/firebase/server-rest.ts", import.meta.url), "utf8");
const workspace = await readFile(new URL("../lib/firebase/workspace.ts", import.meta.url), "utf8");
const appPage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const observability = await readFile(new URL("../lib/observability.ts", import.meta.url), "utf8");

test("Firestore rules retain organization isolation and deny unknown paths", () => {
  assert.match(rules, /resource\.data\.organizationId == organizationId\(\)/);
  assert.match(rules, /request\.resource\.data\.organizationId == organizationId\(\)/);
  assert.match(rules, /match \/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);
  assert.doesNotMatch(rules, /allow read, write: if true/);
});

test("new organization owners require a backend registration authorization", () => {
  assert.match(rules, /request\.resource\.data\.role == 'owner'/);
  assert.match(rules, /request\.resource\.data\.emailVerificationRequired == true/);
  assert.match(rules, /request\.resource\.data\.role == resource\.data\.role/);
  assert.match(rules, /hasRegistrationAuthorization\(\)/);
  assert.match(rules, /orgId == request\.auth\.uid/);
  assert.match(rules, /registrationAuthorizations/);
  assert.match(rules, /request\.resource\.data\.registrationEmail == request\.auth\.token\.email/);
  assert.match(firebaseAuth, /registrationEmail:/);
});

test("team invitations stay email-bound, expiring, and cannot grant owner", () => {
  assert.match(rules, /match \/invitations\/\{invitationId\}/);
  assert.match(rules, /request\.auth\.token\.email == resource\.data\.email/);
  assert.match(rules, /request\.auth\.token\.email == request\.resource\.data\.email/);
  assert.match(rules, /request\.resource\.data\.role in \['admin', 'member', 'viewer'\]/);
  assert.match(rules, /request\.time < resource\.data\.expiresAt/);
  assert.match(rules, /request\.resource\.data\.status == 'active'/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['status', 'updatedAt'\]\)/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['status', 'acceptedBy', 'acceptedAt', 'updatedAt'\]\)/);
  assert.match(rules, /request\.resource\.data\.expiresAt == resource\.data\.expiresAt/);
});

test("only the owner can change another member while preserving organization identity", () => {
  assert.match(rules, /isOwner\(\)/);
  assert.match(rules, /userId != request\.auth\.uid/);
  assert.match(rules, /resource\.data\.role != 'owner'/);
  assert.match(rules, /request\.resource\.data\.organizationId == resource\.data\.organizationId/);
  assert.match(rules, /request\.resource\.data\.status in \['active', 'disabled'\]/);
});

test("shared quotes expose only expiring token reads and immutable versions", () => {
  assert.match(rules, /match \/quoteShares\/\{token\}/);
  assert.match(rules, /allow get: if resource\.data\.active == true[\s\S]*request\.time < resource\.data\.expiresAt[\s\S]*isMinimalShare\(resource\.data\)/);
  assert.match(rules, /allow list: if hasWorkspace\(\)/);
  assert.doesNotMatch(rules, /match \/quoteShares[\s\S]*allow read: if true/);
  assert.match(rules, /token\.matches\('\^\[0-9a-f\]/);
  assert.match(rules, /request\.resource\.data\.expiresAt <= request\.time \+ duration\.value\(30, 'd'\)/);
  assert.match(rules, /request\.resource\.data\.active == false/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['active', 'updatedAt'\]\)/);
  assert.match(rules, /customer\.keys\(\)\.hasOnly\(\['company', 'name'\]\)/);
  assert.match(rules, /settings\.keys\(\)\.hasOnly\(\['companyName', 'address', 'email'\]\)/);
  assert.match(rules, /match \/quoteVersions\/\{documentId\}/);
  assert.match(rules, /allow update, delete: if false/);
  assert.match(workspace, /customer: \{ company: input\.customer\.company, name: input\.customer\.name \}/);
  assert.doesNotMatch(workspace, /customer: input\.customer/);
});

test("organization deletion is an owner-only immutable request", () => {
  assert.match(rules, /match \/deletionRequests\/\{orgId\}/);
  assert.match(rules, /request\.resource\.data\.requestedBy == request\.auth\.uid/);
  assert.match(rules, /request\.resource\.data\.status == 'pending'/);
  assert.match(rules, /allow update, delete: if false/);
});

test("quote activity records are organization-scoped and immutable", () => {
  assert.match(rules, /match \/quoteActivities\/\{documentId\}/);
  assert.match(rules, /request\.resource\.data\.actorId == request\.auth\.uid/);
  assert.match(rules, /request\.resource\.data\.type in \['created', 'pdf_downloaded', 'share_created', 'share_revoked', 'status_changed'\]/);
  assert.match(rules, /request\.resource\.data\.status in \['Taslak', 'Gönderildi', 'Onaylandı', 'Reddedildi'\]/);
  assert.match(rules, /allow update, delete: if false/);
});

test("OpenAI key stays server-side", () => {
  assert.match(aiRoute, /process\.env\.OPENAI_API_KEY/);
  assert.doesNotMatch(firebaseClient, /OPENAI_API_KEY/);
  assert.doesNotMatch(aiRoute, /NEXT_PUBLIC_OPENAI/);
});

test("server routes require authenticated distributed abuse protection without logging request content", () => {
  assert.match(aiRoute, /consumeDistributedRateLimit/);
  assert.match(clientErrorRoute, /consumeDistributedRateLimit/);
  assert.match(clientErrorRoute, /getFirebaseServerContext/);
  assert.match(serverRest, /apiRateLimits/);
  assert.doesNotMatch(serverRest, /new Map/);
  assert.doesNotMatch(aiRoute, /console\.(?:log|warn|error)\([^)]*prompt/);
  assert.doesNotMatch(aiRoute, /console\.(?:log|warn|error)\([^)]*idToken/);
  assert.doesNotMatch(aiRoute, /console\.(?:log|warn|error)\([^)]*apiKey/);
  assert.doesNotMatch(clientErrorRoute, /console\.(?:log|warn|error)\([^)]*idToken/);
});

test("share tokens are kept out of generated URLs and sanitized from client-error paths", () => {
  assert.match(appPage, /\/teklif#\$\{share\.token\}/);
  assert.doesNotMatch(appPage, /\/teklif\/\$\{share\.token\}/);
  assert.match(observability, /\/teklif\/:share/);
});
