import assert from "node:assert/strict";
import test from "node:test";
import {
  authErrorMessage,
  canEditWorkspaceData,
  canManageWorkspace,
  canRequestOrganizationDeletion,
  normalizeWorkspaceRole,
} from "../lib/auth-utils.ts";

test("normalizes known and unknown workspace roles safely", () => {
  assert.equal(normalizeWorkspaceRole("owner"), "owner");
  assert.equal(normalizeWorkspaceRole("admin"), "admin");
  assert.equal(normalizeWorkspaceRole("unexpected"), "member");
  assert.equal(normalizeWorkspaceRole(null), "member");
});

test("only owner and admin roles can manage a workspace", () => {
  assert.equal(canManageWorkspace("owner"), true);
  assert.equal(canManageWorkspace("admin"), true);
  assert.equal(canManageWorkspace("member"), false);
  assert.equal(canManageWorkspace("viewer"), false);
});

test("workspace permissions distinguish editing and deletion requests", () => {
  assert.equal(canEditWorkspaceData("owner"), true);
  assert.equal(canEditWorkspaceData("admin"), true);
  assert.equal(canEditWorkspaceData("member"), true);
  assert.equal(canEditWorkspaceData("viewer"), false);
  assert.equal(canRequestOrganizationDeletion("owner"), true);
  assert.equal(canRequestOrganizationDeletion("admin"), false);
});

test("maps authentication errors without exposing provider details", () => {
  assert.equal(authErrorMessage({ code: "auth/invalid-credential" }), "E-posta veya şifre hatalı.");
  assert.equal(authErrorMessage({ code: "auth/too-many-requests" }), "Çok fazla deneme yapıldı. Lütfen kısa süre sonra tekrar deneyin.");
  assert.equal(authErrorMessage(new Error("secret provider detail")), "İşlem tamamlanamadı. Lütfen tekrar deneyin.");
});
