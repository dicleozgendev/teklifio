import Link from "next/link";
import { FileText } from "lucide-react";

export function PublicInfoPage({ eyebrow, title, intro, children }: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="public-info-page">
      <header className="legal-header">
        <Link className="legal-brand" href="/">
          <span><FileText size={18} /></span>teklif<i>io</i>
        </Link>
        <nav className="public-header-nav" aria-label="Genel bağlantılar">
          <Link href="/yardim">Yardım</Link>
          <Link href="/fiyatlandirma">Fiyatlandırma</Link>
          <Link className="legal-back" href="/">Uygulamaya dön</Link>
        </nav>
      </header>
      <section className="public-info-hero">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <div className="public-info-content">{children}</div>
    </main>
  );
}
