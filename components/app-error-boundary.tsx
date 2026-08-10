"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

type State = { failed: boolean };

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: Error & { digest?: string }) {
    try {
      const key = "teklifio-error-log";
      const current = JSON.parse(sessionStorage.getItem(key) ?? "[]") as unknown[];
      const safeEntry = { at: new Date().toISOString(), path: window.location.pathname, message: error.name || "ApplicationError" };
      sessionStorage.setItem(key, JSON.stringify([...current.slice(-19), safeEntry]));
    } catch { /* Kurtarma ekranı loglamadan da çalışır. */ }
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: error.name || "ApplicationError",
        path: window.location.pathname,
        digest: error.digest,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="app-error-page" role="alert"><AlertTriangle /><h1>Bir şeyler ters gitti</h1><p>Verileriniz silinmedi. Sayfayı yenileyerek güvenli şekilde tekrar deneyebilirsiniz.</p><div><button onClick={() => window.location.reload()}><RefreshCw /> Sayfayı yenile</button><Link href="/">Ana sayfaya dön</Link></div></main>;
  }
}
