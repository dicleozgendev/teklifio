import Link from "next/link";
import { FileText } from "lucide-react";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

// HUKUKİ İNCELEME NOTU: Bu içerikler genel B2B SaaS kullanımına yönelik taslaktır.
// Üretime alınmadan önce Türkiye'de yetkili bir hukuk danışmanı tarafından şirketin
// gerçek süreçleri, saklama süreleri ve sözleşmeleriyle birlikte incelenmelidir.
export function LegalDocument({ eyebrow, title, intro, sections }: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link className="legal-brand" href="/">
          <span><FileText size={18} /></span>teklif<i>io</i>
        </Link>
        <Link className="legal-back" href="/">Uygulamaya dön</Link>
      </header>
      <article className="legal-document">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="legal-intro">{intro}</p>
        <div className="legal-draft-note">
          Bu metin bilgilendirme amaçlı bir taslaktır; hukuk danışmanlığı
          niteliğinde değildir. Üretime geçmeden önce hukuki inceleme yapılmalıdır.
        </div>
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>
        ))}
        <footer>Son güncelleme: 9 Ağustos 2026 · Taslak sürüm</footer>
      </article>
    </main>
  );
}
