import type { Metadata } from "next";
import "./globals.css";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { runtimeFlags } from "@/lib/runtime-config";

export const metadata: Metadata = {
  title: "Teklifio — Profesyonel Teklif ve CRM",
  description: "Müşterilerinizi yönetin, profesyonel tekliflerinizi dakikalar içinde hazırlayın.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <AppErrorBoundary>{children}</AppErrorBoundary>
        {runtimeFlags.demoMode && (
          <aside className="demo-environment" aria-label="Demo ortamı bilgilendirmesi">
            <strong>Demo Ortamı</strong>
            <span>Gösterilen şirket, müşteri, ürün ve finansal veriler kurgusaldır.</span>
          </aside>
        )}
      </body>
    </html>
  );
}
