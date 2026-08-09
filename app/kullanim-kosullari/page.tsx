import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = { title: "Kullanım Koşulları — Teklifio" };

export default function TermsPage() {
  return <LegalDocument eyebrow="HİZMET KOŞULLARI" title="Kullanım Koşulları"
    intro="Bu taslak, Teklifio B2B teklif ve CRM hizmetinin kullanımına ilişkin temel kuralları açıklar. Ticari sözleşmenin taraf, ücret, destek ve fesih hükümleri üretim öncesinde tamamlanmalıdır."
    sections={[
      { title: "1. Hizmetin kapsamı", paragraphs: ["Teklifio; müşteri ve ürün/hizmet kayıtlarının yönetilmesi, fiyat tekliflerinin hazırlanması, PDF çıktısı alınması ve AI destekli taslak oluşturulması için yazılım hizmeti sunar. Hizmet, hukuki, mali veya vergisel danışmanlık sağlamaz."] },
      { title: "2. Hesap ve çalışma alanı sorumluluğu", paragraphs: ["Kullanıcı, hesap bilgilerinin güvenliğinden, yetkilendirdiği kişilerin işlemlerinden ve çalışma alanına yüklediği verilerin hukuka uygunluğundan sorumludur. Başka kişilere ait veriler için gerekli bilgilendirme ve hukuki şartların sağlanması kullanıcı işletmeye aittir."] },
      { title: "3. AI çıktıları ve ticari teklif sorumluluğu", paragraphs: ["AI tarafından oluşturulan içerikler yalnızca taslaktır ve hatalı, eksik veya bağlama uygun olmayan sonuçlar içerebilir. Kullanıcı; fiyat, miktar, ürün/hizmet, indirim, vergi, müşteri ve sözleşme bilgilerini göndermeden önce kontrol etmekle yükümlüdür.", "Nihai ticari teklifin doğruluğu, mevzuata uygunluğu, müşteriye iletilmesi ve doğuracağı ticari sonuçlar tamamen teklifi düzenleyen işletmenin sorumluluğundadır. AI çıktısı tek başına bağlayıcı teklif veya profesyonel görüş oluşturmaz."] },
      { title: "4. Kabul edilebilir kullanım", paragraphs: ["Hizmet; hukuka aykırı içerik üretmek, yetkisiz erişim sağlamak, güvenlik önlemlerini aşmak, üçüncü kişilerin haklarını ihlal etmek veya hizmet bütünlüğünü bozmak amacıyla kullanılamaz."] },
      { title: "5. Fikri mülkiyet", paragraphs: ["Teklifio yazılımı, marka unsurları ve özgün arayüz bileşenleri üzerindeki haklar hizmet sağlayıcıya veya lisans verenlerine aittir. Kullanıcının sisteme yüklediği ticari içerik üzerindeki hakları kullanıcıda kalır."] },
      { title: "6. Hizmet sürekliliği ve sorumluluk sınırı", paragraphs: ["Bakım, güvenlik veya mücbir sebepler nedeniyle hizmette kesintiler yaşanabilir. Uygulanabilir hukukun izin verdiği ölçüde dolaylı zararlar, kâr kaybı veya kullanıcının doğrulamadığı tekliflerden doğan sonuçlar için sorumluluk sınırlanabilir; nihai sınırlar ticari sözleşmede belirlenmelidir."] },
    ]} />;
}
