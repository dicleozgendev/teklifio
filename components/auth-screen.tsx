"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, FileText, LockKeyhole, Mail } from "lucide-react";
import { loginWithEmail, registerWithOrganization, requestPasswordReset } from "@/lib/firebase/auth";
import { authErrorMessage } from "@/lib/auth-utils";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") await loginWithEmail(email, password);
      else if (mode === "signup") await registerWithOrganization({ email, password, fullName, organizationName });
      else {
        await requestPasswordReset(email);
        setSuccess("Şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.");
      }
    } catch (caught) {
      setError(authErrorMessage(caught));
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
          {mode === "reset" && <button type="button" className="auth-back" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}><ArrowLeft /> Girişe dön</button>}
          <h2>{mode === "login" ? "Tekrar hoş geldiniz" : mode === "signup" ? "Çalışma alanınızı oluşturun" : "Şifrenizi sıfırlayın"}</h2>
          <p>{mode === "login" ? "Teklifio hesabınıza giriş yapın." : mode === "signup" ? "İşletmeniz için güvenli bir hesap oluşturun." : "Hesabınıza bağlı e-posta adresine güvenli bir bağlantı gönderelim."}</p>
          {mode === "signup" && <><label>Ad soyad<div className="auth-input"><Mail /><input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div></label><label>Şirket / çalışma alanı<div className="auth-input"><Building2 /><input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required /></div></label></>}
          <label>E-posta<div className="auth-input"><Mail /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div></label>
          {mode !== "reset" && <label>Şifre<div className="auth-input"><LockKeyhole /><input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} /></div></label>}
          {mode === "login" && <button type="button" className="forgot-password" onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}>Şifremi unuttum</button>}
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <button className="primary auth-submit" disabled={loading}>{loading ? "Lütfen bekleyin..." : mode === "login" ? "Giriş Yap" : mode === "signup" ? "Hesap Oluştur" : "Bağlantı Gönder"}<ArrowRight /></button>
          {mode !== "reset" && <div className="auth-switch">{mode === "login" ? "Henüz hesabınız yok mu?" : "Zaten hesabınız var mı?"}<button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}>{mode === "login" ? "Ücretsiz kayıt olun" : "Giriş yapın"}</button></div>}
        </form>
      </section>
    </main>
  );
}
