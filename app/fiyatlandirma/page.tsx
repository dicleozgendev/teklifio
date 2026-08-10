import type { Metadata } from "next";
import { Check, CircleDollarSign, ShieldCheck, Sparkles } from "lucide-react";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Fiyatlandırma — Teklifio" };

const plans = [
  { name: "Demo", icon: Sparkles, label: "Ücretsiz tanıtım", copy: "Kurgusal verilerle ürün deneyimi ve özellik incelemesi.", features: ["Dashboard ve CRM akışı", "Manuel ve AI teklif önizlemesi", "Kurumsal PDF örneği", "Gerçek ticari kullanım için değildir"] },
  { name: "Pilot", icon: CircleDollarSign, label: "Başvuru ile", copy: "İlk işletmelerle kontrollü kullanım, geri bildirim ve kurulum desteği.", features: ["İşletmeye özel çalışma alanı", "Firebase organization izolasyonu", "Müşteri, katalog ve teklif yönetimi", "Fiyat ve kapsam karşılıklı netleştirilir"] },
  { name: "Ticari", icon: ShieldCheck, label: "Yakında", copy: "Abonelik ve ödeme altyapısı tamamlandıktan sonra sunulacak plan.", features: ["Plan limitleri henüz belirlenmedi", "Otomatik ödeme henüz aktif değil", "Fatura süreçleri henüz aktif değil", "Yayın öncesi koşullar ayrıca duyurulacak"] },
];

export default function PricingPage() {
  return <PublicInfoPage eyebrow="ŞEFFAF FİYATLANDIRMA" title="Şimdilik demo ve kontrollü pilot erişim"
    intro="Teklifio henüz otomatik abonelik veya ödeme almıyor. Bu sayfa mevcut erişim durumunu açıklar; bağlayıcı fiyat teklifi veya satış sözleşmesi değildir.">
    <div className="pricing-notice"><strong>Ödeme sistemi aktif değil</strong><span>Kart bilgisi istenmez, otomatik tahsilat yapılmaz ve bu sayfadan satın alma işlemi başlatılamaz.</span></div>
    <section className="pricing-grid" aria-label="Erişim seçenekleri">
      {plans.map(({ name, icon: Icon, label, copy, features }) => <article className={`pricing-card ${name === "Pilot" ? "featured" : ""}`} key={name}><div className="pricing-icon"><Icon /></div><small>{label}</small><h2>{name}</h2><p>{copy}</p><ul>{features.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul><button type="button" disabled>{name === "Demo" ? "Demo erişimi açık" : name === "Pilot" ? "Pilot başvurusu yakında" : "Henüz satışta değil"}</button></article>)}
    </section>
    <section className="pricing-faq"><h2>Fiyatlandırma notları</h2><p>Pilot kapsamı, kullanıcı sayısı, destek ihtiyacı ve kullanım senaryosu netleşmeden ücret taahhüdü verilmez. Ticari planlar yayınlandığında vergiler, faturalandırma, iptal ve yenileme koşulları açıkça gösterilecektir.</p></section>
  </PublicInfoPage>;
}
