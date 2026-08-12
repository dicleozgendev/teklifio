import { readFile } from "node:fs/promises";
import test, { after, before } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp, updateDoc, writeBatch } from "firebase/firestore";

let env;
const now = Date.now();
const validToken = "550e8400-e29b-41d4-a716-446655440000";

before(async () => {
  const [host = "127.0.0.1", port = "8080"] = (process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080").split(":");
  env = await initializeTestEnvironment({
    projectId: "demo-teklifio-security",
    firestore: { host, port: Number(port), rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "organizations/org-a"), { ownerId: "owner-a", registrationEmail: "owner-a@example.com" });
    await setDoc(doc(db, "organizations/org-b"), { ownerId: "owner-b", registrationEmail: "owner-b@example.com" });
    for (const [uid, organizationId, role, email, status = "active"] of [
      ["owner-a", "org-a", "owner", "owner-a@example.com"],
      ["admin-a", "org-a", "admin", "admin-a@example.com"],
      ["member-a", "org-a", "member", "member-a@example.com"],
      ["viewer-a", "org-a", "viewer", "viewer-a@example.com"],
      ["disabled-a", "org-a", "member", "disabled-a@example.com", "disabled"],
      ["member-b", "org-b", "member", "member-b@example.com"],
    ]) await setDoc(doc(db, `users/${uid}`), { uid, organizationId, role, email, status, emailVerificationRequired: true });
    await setDoc(doc(db, "customers/org-a_customer"), { organizationId: "org-a", company: "A" });
    await setDoc(doc(db, "customers/org-b_customer"), { organizationId: "org-b", company: "B" });
    await setDoc(doc(db, "registrationAuthorizations/allowed@example.com"), { email: "allowed@example.com", active: true, expiresAt: Timestamp.fromMillis(now + 86_400_000) });
    await setDoc(doc(db, "registrationAuthorizations/expired-allowed@example.com"), { email: "expired-allowed@example.com", active: true, expiresAt: Timestamp.fromMillis(now - 1_000) });
    await setDoc(doc(db, "invitations/invite-valid"), { id: "invite-valid", organizationId: "org-a", email: "invite@example.com", role: "member", status: "pending", createdBy: "owner-a", expiresAt: Timestamp.fromMillis(now + 86_400_000) });
    await setDoc(doc(db, "invitations/invite-expired"), { id: "invite-expired", organizationId: "org-a", email: "expired@example.com", role: "member", status: "pending", createdBy: "owner-a", expiresAt: Timestamp.fromMillis(now - 1_000) });
    const publicSnapshot = { quote: { id: "TKL-1", date: "2026-08-12", validUntil: "2026-09-12", items: [], note: "", currency: "TRY" }, customer: { company: "A", name: "Contact" }, settings: { companyName: "A", address: "Address", email: "company@example.com" } };
    await setDoc(doc(db, `quoteShares/${validToken}`), { token: validToken, quoteId: "TKL-1", organizationId: "org-a", active: true, expiresAt: Timestamp.fromMillis(now + 86_400_000), createdBy: "owner-a", ...publicSnapshot });
    await setDoc(doc(db, "quoteShares/550e8400-e29b-41d4-a716-446655440001"), { token: "550e8400-e29b-41d4-a716-446655440001", quoteId: "TKL-X", organizationId: "org-a", active: true, expiresAt: Timestamp.fromMillis(now - 1_000), createdBy: "owner-a", ...publicSnapshot });
  });
});

after(async () => env?.cleanup());
const dbFor = (uid, email) => env.authenticatedContext(uid, { email }).firestore();

test("arbitrary authenticated users cannot create an organization or owner profile", async () => {
  const db = dbFor("arbitrary", "arbitrary@example.com");
  await assertFails(setDoc(doc(db, "organizations/arbitrary-org"), { ownerId: "arbitrary", registrationEmail: "arbitrary@example.com" }));
  await assertFails(setDoc(doc(db, "users/arbitrary"), { uid: "arbitrary", organizationId: "arbitrary-org", email: "arbitrary@example.com", role: "owner", status: "active", emailVerificationRequired: true }));
});

test("an allowlisted email can atomically create only its own organization and owner profile", async () => {
  const db = dbFor("allowed", "allowed@example.com");
  const batch = writeBatch(db);
  batch.set(doc(db, "organizations/allowed"), { ownerId: "allowed", registrationEmail: "allowed@example.com" });
  batch.set(doc(db, "users/allowed"), { uid: "allowed", organizationId: "allowed", email: "allowed@example.com", role: "owner", status: "active", emailVerificationRequired: true });
  await assertSucceeds(batch.commit());
  const expiredDb = dbFor("expired-allowed", "expired-allowed@example.com");
  await assertFails(setDoc(doc(expiredDb, "organizations/expired-org"), { ownerId: "expired-allowed", registrationEmail: "expired-allowed@example.com" }));
});

test("organization isolation, viewer restrictions and disabled-user restrictions resist direct writes", async () => {
  await assertSucceeds(getDoc(doc(dbFor("member-a", "member-a@example.com"), "customers/org-a_customer")));
  await assertFails(getDoc(doc(dbFor("member-a", "member-a@example.com"), "customers/org-b_customer")));
  await assertFails(getDoc(doc(dbFor("member-b", "member-b@example.com"), "customers/org-a_customer")));
  await assertFails(setDoc(doc(dbFor("viewer-a", "viewer-a@example.com"), "customers/org-a_new"), { organizationId: "org-a" }));
  await assertFails(getDoc(doc(dbFor("disabled-a", "disabled-a@example.com"), "customers/org-a_customer")));
});

test("invitation acceptance enforces email, expiry and fixed role", async () => {
  await assertFails(updateDoc(doc(dbFor("wrong", "wrong@example.com"), "invitations/invite-valid"), { status: "accepted", acceptedBy: "wrong", acceptedAt: Timestamp.now(), updatedAt: Timestamp.now() }));
  await assertFails(updateDoc(doc(dbFor("expired", "expired@example.com"), "invitations/invite-expired"), { status: "accepted", acceptedBy: "expired", acceptedAt: Timestamp.now(), updatedAt: Timestamp.now() }));
  await assertSucceeds(updateDoc(doc(dbFor("invite-user", "invite@example.com"), "invitations/invite-valid"), { status: "accepted", acceptedBy: "invite-user", acceptedAt: Timestamp.now(), updatedAt: Timestamp.now() }));
});

test("owner/admin/member/viewer role boundaries cannot be escalated directly", async () => {
  await assertFails(updateDoc(doc(dbFor("admin-a", "admin-a@example.com"), "users/member-a"), { role: "admin", updatedAt: Timestamp.now() }));
  await assertFails(updateDoc(doc(dbFor("member-a", "member-a@example.com"), "users/member-a"), { role: "owner", updatedAt: Timestamp.now() }));
  await assertSucceeds(updateDoc(doc(dbFor("owner-a", "owner-a@example.com"), "users/member-a"), { role: "viewer", updatedAt: Timestamp.now() }));
});

test("share tokens are unlistable publicly, guessed tokens fail, and expiry/revocation deny access", async () => {
  const ownerDb = dbFor("owner-a", "owner-a@example.com");
  const newToken = "550e8400-e29b-41d4-a716-446655440002";
  const minimalShare = { token: newToken, quoteId: "TKL-2", organizationId: "org-a", active: true, expiresAt: Timestamp.fromMillis(Date.now() + 86_400_000), createdBy: "owner-a", createdAt: Timestamp.now(), updatedAt: Timestamp.now(), quote: { id: "TKL-2", date: "2026-08-12", validUntil: "2026-09-12", items: [], note: "", currency: "TRY" }, customer: { company: "A", name: "Contact" }, settings: { companyName: "A", address: "Address", email: "company@example.com" } };
  await assertSucceeds(setDoc(doc(ownerDb, `quoteShares/${newToken}`), minimalShare));
  await assertFails(setDoc(doc(ownerDb, "quoteShares/short-token"), { ...minimalShare, token: "short-token" }));
  await assertFails(setDoc(doc(ownerDb, "quoteShares/550e8400-e29b-41d4-a716-446655440003"), { ...minimalShare, token: "550e8400-e29b-41d4-a716-446655440003", customer: { ...minimalShare.customer, phone: "+90-private" } }));
  const publicDb = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(publicDb, `quoteShares/${validToken}`)));
  await assertFails(getDoc(doc(publicDb, "quoteShares/00000000-0000-4000-8000-000000000000")));
  await assertFails(getDocs(collection(publicDb, "quoteShares")));
  await assertFails(getDoc(doc(publicDb, "quoteShares/550e8400-e29b-41d4-a716-446655440001")));
  await assertSucceeds(updateDoc(doc(dbFor("owner-a", "owner-a@example.com"), `quoteShares/${validToken}`), { active: false, updatedAt: Timestamp.now() }));
  await assertFails(getDoc(doc(publicDb, `quoteShares/${validToken}`)));
});

test("rate-limit buckets cannot be reset, reassigned, listed or deleted", async () => {
  const db = dbFor("member-a", "member-a@example.com");
  const windowStart = Math.floor(Date.now() / 60_000) * 60_000;
  const ref = doc(db, `apiRateLimits/member-a_ai-quote_${windowStart}`);
  await assertSucceeds(setDoc(ref, { uid: "member-a", organizationId: "org-a", scope: "ai-quote", count: 1, windowStart: Timestamp.fromMillis(windowStart), expiresAt: Timestamp.fromMillis(windowStart + 120_000) }));
  await assertSucceeds(updateDoc(ref, { count: 2 }));
  await assertFails(updateDoc(ref, { count: 1 }));
  await assertFails(updateDoc(ref, { organizationId: "org-b", count: 3 }));
});
