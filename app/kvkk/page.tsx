import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni — Teklifio" };

export default function KvkkPage() {
  return <LegalDocument eyebrow="6698 SAYILI KANUN" title="KVKK Aydınlatma Metni"
    intro="Bu taslak metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri işleme faaliyetlerine ilişkin temel bilgilendirmeyi sunar. Veri sorumlusunun ticari unvanı ve iletişim bilgileri üretim öncesinde tamamlanmalıdır."
    sections={[
      { title: "1. Veri sorumlusu", paragraphs: ["Kişisel veriler, üretim öncesinde unvanı, adresi ve iletişim kanalları belirtilecek Teklifio hizmet sağlayıcısı tarafından veri sorumlusu sıfatıyla işlenebilir. Müşterilerin kendi CRM kayıtlarına eklediği kişiler bakımından ilgili işletme ayrıca veri sorumlusu olabilir."] },
      { title: "2. Kişisel veri kategorileri", items: ["Kimlik ve iletişim verileri.", "Müşteri işlem, teklif ve sözleşme verileri.", "Şirket, ürün/hizmet ve çalışma alanı bilgileri.", "İşlem güvenliği, oturum ve teknik kayıtlar.", "Kullanıcı talebiyle AI analizine gönderilen içerikler."] },
      { title: "3. İşleme amaçları ve hukuki sebepler", paragraphs: ["Veriler; üyelik ve sözleşmenin kurulması/ifası, hizmetin sunulması, teklif süreçlerinin yürütülmesi, güvenliğin sağlanması, destek taleplerinin karşılanması ve hukuki yükümlülüklerin yerine getirilmesi amaçlarıyla; KVKK'nın 5. ve gerektiğinde 6. maddelerindeki hukuki sebeplere dayanılarak işlenebilir."] },
      { title: "4. Toplama yöntemi ve aktarım", paragraphs: ["Veriler web uygulaması, kullanıcı formları, oturum kayıtları ve destek kanalları üzerinden otomatik veya kısmen otomatik yöntemlerle toplanabilir. Yurt içi veya yurt dışı aktarımlar, KVKK'nın 8. ve 9. maddeleri ile yürürlükteki ikincil düzenlemelere uygun güvence mekanizmalarıyla değerlendirilir."] },
      { title: "5. Saklama ve güvenlik", paragraphs: ["Kişisel veriler amaç için gerekli ve mevzuatta öngörülen sürelerle sınırlı olarak saklanır. Yetki matrisi, organization izolasyonu, erişim kontrolü, güvenli aktarım ve olay yönetimi gibi teknik ve idari tedbirler uygulanır."] },
      { title: "6. İlgili kişinin hakları", items: ["Kişisel veri işlenip işlenmediğini öğrenme ve bilgi talep etme.", "İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme.", "Yurt içinde veya yurt dışında aktarılan üçüncü kişileri bilme.", "Eksik veya yanlış işlenen verilerin düzeltilmesini isteme.", "Kanuni şartlarda silme, yok etme veya anonimleştirme talep etme.", "Münhasıran otomatik analiz sonucu aleyhe bir sonuca itiraz etme ve zararın giderilmesini talep etme."] },
    ]} />;
}
