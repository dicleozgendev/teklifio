"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, FileText, Sparkles } from "lucide-react";
import type { WorkspaceSettings } from "@/lib/firebase/workspace";

export function Onboarding({
  organizationName,
  settings,
  onComplete,
}: {
  organizationName: string;
  settings: WorkspaceSettings;
  onComplete: (settings: WorkspaceSettings) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof WorkspaceSettings, value: WorkspaceSettings[keyof WorkspaceSettings]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const finish = async () => {
    if (!form.companyName.trim() || !form.quotePrefix.trim() || form.validityDays < 1) {
      setError("Şirket adı, teklif ön eki ve geçerlilik süresini kontrol edin.");
      return;
    }
    setLoading(true); setError("");
    try { await onComplete(form); }
    catch { setError("Kurulum kaydedilemedi. Lütfen tekrar deneyin."); }
    finally { setLoading(false); }
  };

  return <div className="onboarding-wrap" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
    <section className="onboarding-card">
      <div className="onboarding-progress" aria-label={`Kurulum adımı ${step + 1} / 3`}>
        {[0, 1, 2].map((item) => <i key={item} className={item <= step ? "active" : ""} />)}
      </div>
      {step === 0 && <div className="onboarding-welcome">
        <span><Sparkles /></span>
        <small>HOŞ GELDİNİZ</small>
        <h1 id="onboarding-title">{organizationName} çalışma alanı hazır</h1>
        <p>Tekliflerinizi doğru şirket bilgileri ve varsayılanlarla hazırlamak için iki kısa adımı tamamlayın.</p>
        <ul><li><Check /> İlk müşteri ve ürünlerinizi siz eklersiniz</li><li><Check /> Ayarları daha sonra değiştirebilirsiniz</li><li><Check /> Kurulum sırasında ödeme alınmaz</li></ul>
      </div>}
      {step === 1 && <div>
        <div className="section-title"><span><Building2 /></span><div><h3 id="onboarding-title">Şirket bilgileri</h3><p>Bu bilgiler teklif detayında ve PDF belgesinde görünür.</p></div></div>
        <div className="form-grid onboarding-form">
          <label className="full">Şirket adı<input required value={form.companyName} onChange={(event) => set("companyName", event.target.value)} /></label>
          <label>Telefon<input value={form.phone} onChange={(event) => set("phone", event.target.value)} /></label>
          <label>E-posta<input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} /></label>
          <label className="full">Adres<textarea rows={3} value={form.address} onChange={(event) => set("address", event.target.value)} /></label>
        </div>
      </div>}
      {step === 2 && <div>
        <div className="section-title"><span><FileText /></span><div><h3 id="onboarding-title">Teklif tercihleri</h3><p>Yeni tekliflerde kullanılacak güvenli varsayılanları belirleyin.</p></div></div>
        <div className="form-grid onboarding-form">
          <label>Teklif ön eki<input maxLength={12} required value={form.quotePrefix} onChange={(event) => set("quotePrefix", event.target.value.toLocaleUpperCase("tr-TR").replace(/[^A-ZÇĞİÖŞÜ0-9-]/g, ""))} /></label>
          <label>Geçerlilik süresi<input type="number" min="1" max="365" value={form.validityDays} onChange={(event) => set("validityDays", Number(event.target.value))} /></label>
          <label>Varsayılan KDV<select value={form.defaultVat} onChange={(event) => set("defaultVat", Number(event.target.value))}>{form.vatRates.map((rate) => <option key={rate} value={rate}>%{rate}</option>)}</select></label>
          <label>Para birimi<select value={form.currency} onChange={(event) => set("currency", event.target.value)}><option value="TRY">TRY — Türk Lirası</option><option value="USD">USD — ABD Doları</option><option value="EUR">EUR — Euro</option></select></label>
        </div>
      </div>}
      {error && <div className="auth-error">{error}</div>}
      <footer className="onboarding-actions">
        {step > 0 ? <button className="secondary" onClick={() => setStep((current) => current - 1)} disabled={loading}><ArrowLeft /> Geri</button> : <span />}
        {step < 2 ? <button className="primary" onClick={() => setStep((current) => current + 1)}>Devam et <ArrowRight /></button> : <button className="primary" onClick={finish} disabled={loading}><Check /> {loading ? "Kaydediliyor..." : "Kurulumu tamamla"}</button>}
      </footer>
    </section>
  </div>;
}
