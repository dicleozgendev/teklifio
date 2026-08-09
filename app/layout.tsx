import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teklifio — Profesyonel Teklif ve CRM",
  description: "Müşterilerinizi yönetin, profesyonel tekliflerinizi dakikalar içinde hazırlayın.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  return (
    <html lang="tr">
      <body>
        {children}
        {demoMode && (
          <aside className="demo-environment" aria-label="Demo ortamı bilgilendirmesi">
            <strong>Demo Ortamı</strong>
            <span>Gösterilen şirket, müşteri, ürün ve finansal veriler kurgusaldır.</span>
          </aside>
        )}
      </body>
    </html>
  );
}
