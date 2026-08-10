"use client";

import { useState } from "react";
import { CheckCircle2, FileText, LogOut, Mail, RefreshCw } from "lucide-react";
import { signOut } from "firebase/auth";
import { authErrorMessage } from "@/lib/auth-utils";
import { getFirebaseServices } from "@/lib/firebase/client";
import { refreshEmailVerification, resendVerificationEmail } from "@/lib/firebase/auth";

export function VerifyEmailScreen({ email }: { email: string }) {
  const [loading, setLoading] = useState<"check" | "resend" | "logout" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const check = async () => {
    setLoading("check"); setError(""); setMessage("");
    try {
      if (await refreshEmailVerification()) window.location.reload();
      else setMessage("E-posta henüz doğrulanmamış görünüyor. Bağlantıya tıkladıktan sonra tekrar kontrol edin.");
    } catch (caught) { setError(authErrorMessage(caught)); }
    finally { setLoading(null); }
  };
  const resend = async () => {
    setLoading("resend"); setError(""); setMessage("");
    try {
      await resendVerificationEmail();
      setMessage("Yeni doğrulama e-postası gönderildi. Spam klasörünü de kontrol edin.");
    } catch (caught) { setError(authErrorMessage(caught)); }
    finally { setLoading(null); }
  };
  const logout = async () => {
    const services = getFirebaseServices();
    if (!services) return;
    setLoading("logout");
    await signOut(services.auth);
  };

  return <main className="verification-page">
    <section className="verification-card">
      <div className="auth-mobile-brand"><FileText /> teklifio</div>
      <span className="verification-icon"><Mail /></span>
      <h1>E-postanızı doğrulayın</h1>
      <p><b>{email}</b> adresine bir doğrulama bağlantısı gönderdik. Çalışma alanınızı açmadan önce bağlantıya tıklayın.</p>
      <div className="verification-tip"><CheckCircle2 /><span>Doğrulama tamamlanana kadar müşteri, ürün veya teklif verisi oluşturulmaz.</span></div>
      {message && <div className="auth-success">{message}</div>}
      {error && <div className="auth-error">{error}</div>}
      <button className="primary" onClick={check} disabled={Boolean(loading)}><RefreshCw /> {loading === "check" ? "Kontrol ediliyor..." : "Doğrulamayı kontrol et"}</button>
      <button className="secondary" onClick={resend} disabled={Boolean(loading)}>{loading === "resend" ? "Gönderiliyor..." : "E-postayı tekrar gönder"}</button>
      <button className="verification-logout" onClick={logout} disabled={Boolean(loading)}><LogOut /> Farklı hesapla giriş yap</button>
    </section>
  </main>;
}
