"use client";

import Link from "next/link";
import { Bot, Building2, FileText, LifeBuoy, PackagePlus, RotateCcw, Users, X } from "lucide-react";

type SupportAction = "settings" | "customers" | "products" | "new-quote";

export function SupportPanel({
  onClose,
  onNavigate,
  onReplayOnboarding,
  editable,
}: {
  onClose: () => void;
  onNavigate: (action: SupportAction) => void;
  onReplayOnboarding: () => void;
  editable: boolean;
}) {
  const navigate = (action: SupportAction) => {
    onNavigate(action);
    onClose();
  };

  return (
    <>
      <button className="support-scrim" aria-label="Destek panelini kapat" onClick={onClose} />
      <aside className="support-panel" role="dialog" aria-modal="true" aria-labelledby="support-title">
        <header>
          <span><LifeBuoy /></span>
          <div><small>YARDIM VE DESTEK</small><h2 id="support-title">Nasıl yardımcı olabiliriz?</h2></div>
          <button aria-label="Destek panelini kapat" onClick={onClose}><X /></button>
        </header>
        <p className="support-intro">Sık kullanılan işlemlere gidin veya başlangıç rehberini yeniden açın.</p>
        <div className="support-actions">
          <button onClick={() => navigate("settings")}><Building2 /><span><b>Şirket ayarları</b><small>PDF ve teklif bilgilerini düzenleyin</small></span></button>
          <button onClick={() => navigate("customers")}><Users /><span><b>{editable ? "Müşteri ekleyin" : "Müşterileri görüntüleyin"}</b><small>{editable ? "CRM kaydı oluşturun" : "CRM kayıtlarını inceleyin"}</small></span></button>
          <button onClick={() => navigate("products")}><PackagePlus /><span><b>{editable ? "Ürün veya hizmet ekleyin" : "Ürün ve hizmetleri görüntüleyin"}</b><small>{editable ? "Kataloğunuzu hazırlayın" : "Katalog kayıtlarını inceleyin"}</small></span></button>
          <button onClick={() => navigate("new-quote")}><FileText /><span><b>{editable ? "Teklif oluşturun" : "Teklifleri görüntüleyin"}</b><small>{editable ? "Manuel veya AI destekli başlayın" : "Mevcut teklifleri inceleyin"}</small></span></button>
        </div>
        <button className="support-replay" onClick={() => { onReplayOnboarding(); onClose(); }}><RotateCcw /> Başlangıç rehberini tekrar aç</button>
        <section className="support-ai-note"><Bot /><p><b>AI çıktıları taslaktır.</b> Fiyat, müşteri, ürün/hizmet ve vergi bilgilerini kaydetmeden önce kontrol edin.</p></section>
        <footer>
          <Link href="/yardim">Tüm yardım içeriklerini aç</Link>
          <p>Teknik bir sorunda hata zamanını ve gördüğünüz ekranı paylaşın; şifre veya müşteri verisi göndermeyin.</p>
        </footer>
      </aside>
    </>
  );
}
