import type { Metadata } from "next";
import { Bot, Building2, FileDown, PackagePlus, ShieldCheck, Users } from "lucide-react";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Yardım Merkezi — Teklifio" };

const steps = [
  { icon: Building2, title: "Şirket ayarlarını tamamlayın", copy: "Logo, şirket bilgileri, para birimi, KDV ve teklif varsayılanlarını Ayarlar ekranından kontrol edin." },
  { icon: Users, title: "Müşterilerinizi ekleyin", copy: "Müşteri şirketi, yetkili kişi, iletişim, adres ve vergi bilgilerini kaydedin." },
  { icon: PackagePlus, title: "Kataloğu hazırlayın", copy: "Ürün ve hizmetlerinizi birim, fiyat, varsayılan KDV ve açıklamayla ekleyin." },
  { icon: Bot, title: "Teklifi manuel veya AI ile oluşturun", copy: "AI yalnızca mevcut müşteri ve katalog kayıtlarını eşleştirir. Önizlemeyi kontrol etmeden uygulamayın." },
  { icon: FileDown, title: "Kontrol edin ve PDF alın", copy: "Miktar, fiyat, indirim, vergi, müşteri ve geçerlilik tarihini doğruladıktan sonra PDF'yi indirin." },
];

export default function HelpPage() {
  return <PublicInfoPage eyebrow="YARDIM MERKEZİ" title="İlk teklifinizi güvenle hazırlayın"
    intro="Teklifio'yu kurmak, müşteri ve katalog kayıtlarını yönetmek, teklif oluşturmak ve güvenli çalışmak için kısa kullanım rehberi.">
    <section className="guide-grid" aria-label="Başlangıç adımları">
      {steps.map(({ icon: Icon, title, copy }, index) => <article className="guide-card" key={title}><span><Icon /></span><small>ADIM {index + 1}</small><h2>{title}</h2><p>{copy}</p></article>)}
    </section>
    <section className="help-panel">
      <div><ShieldCheck /><h2>Güvenli kullanım kontrol listesi</h2></div>
      <ul>
        <li>Hesabınızı doğrulayın ve şifrenizi başka hizmetlerde tekrar kullanmayın.</li>
        <li>Ekip üyelerine yalnız ihtiyaç duydukları rolü verin.</li>
        <li>AI teklifini kaydetmeden önce tüm ticari alanları insan gözüyle kontrol edin.</li>
        <li>Hassas kişisel verileri teklif notlarına veya AI talebine yazmayın.</li>
        <li>Şüpheli erişimde oturumu kapatın ve çalışma alanı yöneticinizi bilgilendirin.</li>
      </ul>
    </section>
    <section className="faq-section">
      <h2>Sık sorulan sorular</h2>
      <details><summary>AI yeni müşteri veya ürün oluşturur mu?</summary><p>Hayır. AI akışı yalnızca organization içindeki mevcut müşteri ve katalog kayıtlarıyla eşleşir; bulunamayan kayıtları uydurmaz.</p></details>
      <details><summary>AI sonucu otomatik kaydedilir mi?</summary><p>Hayır. Sonuç önce önizleme olarak gösterilir. Kullanıcı teklife uygulamadan ve teklif formunu kaydetmeden Firestore’a teklif yazılmaz.</p></details>
      <details><summary>PDF nerede saklanır?</summary><p>Mevcut sürüm PDF’yi tarayıcıda üretip indirir. Sunucuda kalıcı PDF dosyası saklama henüz bulunmaz.</p></details>
      <details><summary>Hesap veya veri talebini nasıl yönetirim?</summary><p>Ayarlar ekranından verilerinizi dışa aktarabilir ve organization silme talebi oluşturabilirsiniz. Silme talepleri güvenli operasyon süreciyle tamamlanmalıdır.</p></details>
      <details><summary>Bir sorun yaşarsam ne yapmalıyım?</summary><p>Sayfayı yenileyin, bağlantınızı kontrol edin ve tekrar giriş yapın. Sorun sürerse pilot erişimi sırasında size bildirilen destek kanalına hata zamanı ve gördüğünüz ekranı iletin; şifre veya müşteri verisi paylaşmayın.</p></details>
    </section>
  </PublicInfoPage>;
}
