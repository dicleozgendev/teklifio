import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = { title: "Gizlilik Politikası — Teklifio" };

export default function PrivacyPage() {
  return <LegalDocument eyebrow="HUKUKİ METİNLER" title="Gizlilik Politikası"
    intro="Bu taslak, Teklifio hizmetinin kullanımı sırasında işlenen bilgilerin genel çerçevesini şeffaf biçimde açıklamak amacıyla hazırlanmıştır."
    sections={[
      { title: "1. İşlenen veri kategorileri", items: [
        "Hesap ve iletişim bilgileri: ad, soyad, e-posta adresi ve giriş bilgileri.",
        "Şirket ve CRM verileri: işletme bilgileri, müşteri kayıtları, ürün/hizmet kataloğu ve teklif içerikleri.",
        "Teknik veriler: oturum, hata, güvenlik ve cihaz/bağlantı kayıtları.",
        "AI kullanım verileri: teklif oluşturmak amacıyla gönderilen talep metinleri ve yapılandırılmış sonuçlar.",
      ]},
      { title: "2. İşleme amaçları", paragraphs: ["Veriler; hesap ve çalışma alanı oluşturmak, teklif ve CRM özelliklerini sunmak, güvenliği sağlamak, hataları gidermek, kullanıcı desteği vermek ve hizmet kalitesini geliştirmek amaçlarıyla işlenebilir."] },
      { title: "3. Saklama ve silme", paragraphs: ["Veriler, hizmetin sunulması ve hukuki yükümlülüklerin yerine getirilmesi için gerekli süre boyunca saklanır. Süreler veri türüne, sözleşmesel ilişkiye ve uygulanabilir mevzuata göre belirlenir; süre sonunda veriler güvenli biçimde silinir, anonimleştirilir veya mevzuat gerektiriyorsa arşivlenir."] },
      { title: "4. Güvenlik", paragraphs: ["Yetkilendirme, organization bazlı veri izolasyonu, erişim kontrolleri, aktarım güvenliği ve kayıt izleme gibi makul teknik ve idari tedbirler uygulanır. Hiçbir sistem mutlak güvenlik garantisi vermez; olaylar risk temelli biçimde yönetilir."] },
      { title: "5. Paylaşım ve hizmet sağlayıcılar", paragraphs: ["Veriler yalnızca hizmetin yürütülmesi için gerekli olduğunda barındırma, kimlik doğrulama, veritabanı ve yapay zekâ hizmeti sağlayıcılarıyla, uygun sözleşmesel ve teknik güvenceler altında paylaşılabilir. Yasal zorunluluklar ayrıca uygulanır."] },
      { title: "6. İlgili kişi hakları", paragraphs: ["İlgili kişiler, uygulanabilir mevzuat kapsamında verilerine erişme, düzeltme, silme veya işlemeyi sınırlandırma; işlemeye itiraz etme ve yetkili makamlara başvurma haklarını kullanabilir. Talepler, uygulamada ilan edilecek veri sorumlusu iletişim kanalına yöneltilebilir."] },
    ]} />;
}
