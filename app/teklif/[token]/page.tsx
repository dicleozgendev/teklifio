"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { CheckCircle2, FileText, LockKeyhole, Printer } from "lucide-react";
import { getFirebaseServices } from "@/lib/firebase/client";
import type { QuoteShare } from "@/lib/firebase/workspace";

const money = (value: number, currency = "TRY") => new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(value);

export default function SharedQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const [share, setShare] = useState<QuoteShare | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    params.then(async ({ token }) => {
      const services = getFirebaseServices();
      if (!services) { setState("unavailable"); return; }
      try {
        const snapshot = await getDoc(doc(services.db, "quoteShares", token));
        if (!snapshot.exists()) { setState("unavailable"); return; }
        setShare(snapshot.data() as QuoteShare); setState("ready");
      } catch { setState("unavailable"); }
    });
  }, [params]);
  const totals = useMemo(() => {
    const items = share?.quote.items ?? [];
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const discount = items.reduce((sum, item) => sum + item.qty * item.price * item.discount / 100, 0);
    const vat = items.reduce((sum, item) => { const net = item.qty * item.price * (1 - item.discount / 100); return sum + net * item.vat / 100; }, 0);
    return { subtotal, discount, vat, total: subtotal - discount + vat };
  }, [share]);

  if (state === "loading") return <main className="shared-quote-state"><FileText /><h1>Teklif hazırlanıyor</h1><p>Güvenli paylaşım bağlantısı kontrol ediliyor.</p></main>;
  if (state === "unavailable" || !share) return <main className="shared-quote-state"><LockKeyhole /><h1>Bağlantı kullanılamıyor</h1><p>Bu teklif bağlantısının süresi dolmuş veya işletme tarafından kapatılmış olabilir.</p></main>;
  const { quote, customer, settings } = share;
  return <main className="shared-quote-page">
    <header className="shared-quote-toolbar"><div><span><CheckCircle2 /> Güvenli, salt-okunur teklif</span><small>Bu bağlantı üzerinden değişiklik yapılamaz.</small></div><button onClick={() => window.print()}><Printer /> Yazdır / PDF</button></header>
    <article className="shared-quote-paper">
      <div className="shared-paper-head"><div className="brand"><div className="brand-mark"><FileText /></div><span>teklif<span>io</span></span></div><div><b>TEKLİF</b><span>{quote.id}</span></div></div>
      <section className="shared-info"><div><small>HAZIRLAYAN</small><b>{settings.companyName}</b><span>{settings.address}</span><span>{settings.email}</span></div><div><small>MÜŞTERİ</small><b>{customer.company}</b><span>{customer.name}</span><span>{customer.email}</span></div><div><small>TARİH</small><b>{new Date(quote.date).toLocaleDateString("tr-TR")}</b><span>Geçerlilik: {new Date(quote.validUntil).toLocaleDateString("tr-TR")}</span></div></section>
      <div className="shared-table-wrap"><table className="paper-table"><thead><tr><th>ÜRÜN / HİZMET</th><th>ADET</th><th>BİRİM FİYAT</th><th>İNDİRİM</th><th>KDV</th><th>TUTAR</th></tr></thead><tbody>{quote.items.map((item) => <tr key={item.id}><td><b>{item.name}</b></td><td>{item.qty}</td><td>{money(item.price, quote.currency)}</td><td>%{item.discount}</td><td>%{item.vat}</td><td><b>{money(item.qty * item.price * (1 - item.discount / 100) * (1 + item.vat / 100), quote.currency)}</b></td></tr>)}</tbody></table></div>
      <section className="shared-bottom"><div>{quote.note && <><small>TEKLİF NOTU</small><p>{quote.note}</p></>}</div><div className="paper-totals"><p><span>Ara toplam</span><b>{money(totals.subtotal, quote.currency)}</b></p><p><span>İndirim</span><b>− {money(totals.discount, quote.currency)}</b></p><p><span>KDV</span><b>{money(totals.vat, quote.currency)}</b></p><p className="paper-grand"><span>Genel toplam</span><b>{money(totals.total, quote.currency)}</b></p></div></section>
      <footer>Bu teklif {new Date(quote.validUntil).toLocaleDateString("tr-TR")} tarihine kadar geçerlidir. Nihai kabul ve ticari koşullar teklifi hazırlayan işletmenin sorumluluğundadır.</footer>
    </article>
  </main>;
}
