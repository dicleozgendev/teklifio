export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

const roles: WorkspaceRole[] = ["owner", "admin", "member", "viewer"];

export function normalizeWorkspaceRole(value: unknown): WorkspaceRole {
  return roles.includes(value as WorkspaceRole) ? (value as WorkspaceRole) : "member";
}

export function canManageWorkspace(role: WorkspaceRole) {
  return role === "owner" || role === "admin";
}

export function canEditWorkspaceData(role: WorkspaceRole) {
  return role !== "viewer";
}

export function canRequestOrganizationDeletion(role: WorkspaceRole) {
  return role === "owner";
}

export function authErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
  if (code === "auth/email-already-in-use") return "Bu e-posta adresi zaten kullanılıyor.";
  if (code === "auth/invalid-credential") return "E-posta veya şifre hatalı.";
  if (code === "auth/weak-password") return "En az 8 karakterli daha güçlü bir şifre seçin.";
  if (code === "auth/invalid-email") return "Geçerli bir e-posta adresi girin.";
  if (code === "auth/too-many-requests") return "Çok fazla deneme yapıldı. Lütfen kısa süre sonra tekrar deneyin.";
  if (code === "auth/user-not-found") return "Bu e-posta adresiyle kayıtlı hesap bulunamadı.";
  if (code === "auth/operation-not-allowed") return "Firebase Console'da E-posta/Şifre giriş yöntemi henüz etkin değil.";
  if (code === "auth/unauthorized-domain") return "Bu alan adı Firebase Authentication için yetkilendirilmemiş.";
  if (code === "auth/network-request-failed") return "Firebase ağına ulaşılamadı. İnternet bağlantısını kontrol edin.";
  if (code === "permission-denied") return "Firestore erişimi reddedildi. Güvenlik kurallarını kontrol edin.";
  if (code === "unavailable") return "Firebase servisine şu anda ulaşılamıyor. Lütfen kısa süre sonra tekrar deneyin.";
  const safeMessages = [
    "Davet bağlantısı bulunamadı veya erişim izniniz yok.",
    "Bu davet daha önce kullanılmış veya iptal edilmiş.",
    "Bu davet farklı bir e-posta adresi için oluşturulmuş.",
    "Bu davetin süresi dolmuş.",
    "Davet rolü geçerli değil.",
    "Hesabınız bu çalışma alanında devre dışı bırakılmış.",
  ];
  if (error instanceof Error && safeMessages.includes(error.message)) return error.message;
  return "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}
