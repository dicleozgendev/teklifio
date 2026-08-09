"use client";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { ArrowRight, Building2, CheckCircle2, FileText, LockKeyhole, Mail } from "lucide-react";
import { loginWithEmail, registerWithOrganization } from "@/lib/firebase/auth";

const authError = (error: unknown) => {
  if (!(error instanceof FirebaseError)) return "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
  if (error.code === "auth/email-already-in-use") return "Bu e-posta adresi zaten kullanılıyor.";
  if (error.code === "auth/invalid-credential") return "E-posta veya şifre hatalı.";
  if (error.code === "auth/weak-password") return "Daha güçlü bir şifre seçin.";
  if (error.code === "auth/operation-not-allowed")
    return "Firebase Console'da E-posta/Şifre giriş yöntemi henüz etkin değil.";
  if (error.code === "auth/unauthorized-domain")
    return "localhost, Firebase Authentication yetkili alan adlarında bulunmuyor.";
  if (error.code === "auth/network-request-failed")
    return "Firebase ağına ulaşılamadı. İnternet bağlantısını kontrol edin.";
  if (error.code === "permission-denied")
    return "Firestore erişimi reddedildi. Projenin güvenlik kurallarının yayımlandığını kontrol edin.";
  if (error.code === "unavailable")
    return "Firestore servisine şu anda ulaşılamıyor. Lütfen kısa süre sonra tekrar deneyin.";
  return `Kimlik doğrulama işlemi tamamlanamadı (${error.code}).`;
};

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") await loginWithEmail(email, password);
      else await registerWithOrganization({ email, password, fullName, organizationName });
    } catch (caught) {
      setError(authError(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="auth-brand"><span><FileText /></span>teklif<i>io</i></div>
        <div className="auth-copy"><span className="eyebrow">B2B TEKLİF & CRM</span><h1>Tekliften imzaya,<br />tüm satış süreci tek yerde.</h1><p>Profesyonel tekliflerinizi dakikalar içinde hazırlayın ve müşteri sürecinizi güvenle yönetin.</p><div><CheckCircle2 /> Her işletme için izole ve güvenli çalışma alanı</div><div><CheckCircle2 /> AI destekli teklif hazırlama ve kurumsal PDF</div></div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-mobile-brand"><FileText /> teklifio</div>
          <h2>{mode === "login" ? "Tekrar hoş geldiniz" : "Çalışma alanınızı oluşturun"}</h2>
          <p>{mode === "login" ? "Teklifio hesabınıza giriş yapın." : "İşletmeniz için güvenli bir hesap oluşturun."}</p>
          {mode === "signup" && <><label>Ad soyad<div className="auth-input"><Mail /><input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div></label><label>Şirket / çalışma alanı<div className="auth-input"><Building2 /><input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required /></div></label></>}
          <label>E-posta<div className="auth-input"><Mail /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div></label>
          <label>Şifre<div className="auth-input"><LockKeyhole /><input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} /></div></label>
          {error && <div className="auth-error">{error}</div>}
          <button className="primary auth-submit" disabled={loading}>{loading ? "Lütfen bekleyin..." : mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}<ArrowRight /></button>
          <div className="auth-switch">{mode === "login" ? "Henüz hesabınız yok mu?" : "Zaten hesabınız var mı?"}<button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>{mode === "login" ? "Ücretsiz kayıt olun" : "Giriş yapın"}</button></div>
        </form>
      </section>
    </main>
  );
}
