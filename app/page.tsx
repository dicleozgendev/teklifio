"use client";
/* eslint-disable jsx-a11y/no-autofocus */

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { AuthScreen } from "@/components/auth-screen";
import { Onboarding } from "@/components/onboarding";
import { SupportPanel } from "@/components/support-panel";
import { VerifyEmailScreen } from "@/components/verify-email-screen";
import { downloadQuotePdf } from "@/lib/quote-pdf";
import {
  deterministicQuoteAi,
  type AiQuoteDraft,
} from "@/lib/ai-quote-parser";
import {
  apiResponseToDraft,
  type AiQuoteApiResponse,
} from "@/lib/ai-quote-contract";
import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  deleteCustomer,
  deleteProduct,
  completeWorkspaceOnboarding,
  cancelWorkspaceInvitation,
  createQuoteShare,
  createWorkspaceInvitation,
  loadTeamMembers,
  loadQuoteShares,
  loadQuoteActivities,
  loadQuoteVersions,
  loadWorkspaceInvitations,
  loadWorkspaceData,
  saveCustomer,
  saveProduct,
  saveQuote,
  saveWorkspaceSettings,
  revokeQuoteShare,
  logQuoteActivity,
  requestOrganizationDeletion,
  type QuoteShare,
  type QuoteActivity,
  type QuoteVersion,
  updateWorkspaceMember,
  updateQuoteStatus,
  type WorkspaceInvitation,
  type WorkspaceMember,
  type WorkspaceProfile,
  type WorkspaceSettings,
  type WorkspaceQuoteStatus,
} from "@/lib/firebase/workspace";
import { requestPasswordReset, resendVerificationEmail, updateAccountName } from "@/lib/firebase/auth";
import { authErrorMessage, canEditWorkspaceData, canManageWorkspace, type WorkspaceRole } from "@/lib/auth-utils";
import { runtimeFlags } from "@/lib/runtime-config";
import { previewCustomerCsv, previewProductCsv, type CsvPreviewRow } from "@/lib/csv-import";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Bell,
  Box,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  PackagePlus,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

type Screen =
  | "dashboard"
  | "customers"
  | "products"
  | "quotes"
  | "new-quote"
  | "quote-detail"
  | "settings";
type Customer = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
  taxOffice?: string;
  taxNumber?: string;
  notes?: string;
  initials: string;
  color: string;
};
type Product = {
  id: number;
  name: string;
  code: string;
  type: "Ürün" | "Hizmet";
  price: number;
  vat: number;
  unit: string;
  description?: string;
};
type QuoteItem = {
  id: number;
  productId: number;
  name: string;
  qty: number;
  price: number;
  discount: number;
  vat: number;
};
type Quote = {
  id: string;
  customerId: number;
  date: string;
  validUntil: string;
  status: WorkspaceQuoteStatus;
  items: QuoteItem[];
  note: string;
  currency?: string;
};

const currency = (value: number, code = "TRY") =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(value);
const today = () => new Date().toISOString().slice(0, 10);
const later = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const defaultSettings: WorkspaceSettings = {
  companyName: "Teklifio Dijital Çözümler", address: "Maslak Mah. Büyükdere Cad. No: 255, Sarıyer / İstanbul",
  phone: "+90 212 555 01 01", email: "merhaba@teklifio.com", website: "https://teklifio.vercel.app",
  taxOffice: "Maslak", taxNumber: "123 456 7890", logoDataUrl: "", primaryColor: "#6756e8", validityDays: 14, quotePrefix: "TKL",
  currency: "TRY", defaultNote: "İş birliğiniz için teşekkür ederiz.", footerText: "Bu teklif belirtilen geçerlilik tarihine kadar geçerlidir.",
  vatRates: [0, 1, 10, 20], defaultVat: 20,
};

const starterCustomers: Customer[] = [
  {
    id: 1,
    name: "Selin Yılmaz",
    company: "Nova Teknoloji A.Ş.",
    email: "selin@novateknoloji.com",
    phone: "+90 532 234 18 90",
    initials: "NY",
    color: "indigo",
  },
  {
    id: 2,
    name: "Mert Aydın",
    company: "Pixel Ajans",
    email: "mert@pixelajans.com",
    phone: "+90 555 782 44 12",
    initials: "PA",
    color: "amber",
  },
  {
    id: 3,
    name: "Ece Demir",
    company: "Lunaris Mimarlık",
    email: "ece@lunaris.com",
    phone: "+90 533 420 67 11",
    initials: "LM",
    color: "rose",
  },
  {
    id: 4,
    name: "Can Öztürk",
    company: "Atlas Lojistik",
    email: "can@atlaslojistik.com",
    phone: "+90 541 112 08 25",
    initials: "AL",
    color: "emerald",
  },
  {
    id: 5,
    name: "İrem Kaya",
    company: "Mavi Perakende",
    email: "irem@maviperakende.com",
    phone: "+90 505 665 21 33",
    initials: "MP",
    color: "sky",
  },
];

const starterProducts: Product[] = [
  {
    id: 1,
    name: "Kurumsal Web Sitesi",
    code: "HIZ-001",
    type: "Hizmet",
    price: 45000,
    vat: 20,
    unit: "Proje",
  },
  {
    id: 2,
    name: "SEO Danışmanlığı",
    code: "HIZ-002",
    type: "Hizmet",
    price: 12500,
    vat: 20,
    unit: "Ay",
  },
  {
    id: 3,
    name: "Premium Destek Paketi",
    code: "HIZ-003",
    type: "Hizmet",
    price: 7500,
    vat: 20,
    unit: "Ay",
  },
  {
    id: 4,
    name: "E-ticaret Entegrasyonu",
    code: "YAZ-001",
    type: "Ürün",
    price: 28000,
    vat: 20,
    unit: "Adet",
  },
  {
    id: 5,
    name: "Marka Kimliği Tasarımı",
    code: "HIZ-004",
    type: "Hizmet",
    price: 32000,
    vat: 20,
    unit: "Proje",
  },
];

const initialQuotes: Quote[] = [
  {
    id: "TKL-2026-0048",
    customerId: 1,
    date: "2026-08-06",
    validUntil: "2026-08-20",
    status: "Onaylandı",
    note: "İş birliğiniz için teşekkür ederiz.",
    items: [
      {
        id: 1,
        productId: 1,
        name: "Kurumsal Web Sitesi",
        qty: 1,
        price: 45000,
        discount: 0,
        vat: 20,
      },
      {
        id: 2,
        productId: 3,
        name: "Premium Destek Paketi",
        qty: 3,
        price: 7500,
        discount: 10,
        vat: 20,
      },
    ],
  },
  {
    id: "TKL-2026-0047",
    customerId: 2,
    date: "2026-08-05",
    validUntil: "2026-08-19",
    status: "Gönderildi",
    note: "",
    items: [
      {
        id: 1,
        productId: 5,
        name: "Marka Kimliği Tasarımı",
        qty: 1,
        price: 32000,
        discount: 5,
        vat: 20,
      },
    ],
  },
  {
    id: "TKL-2026-0046",
    customerId: 3,
    date: "2026-08-04",
    validUntil: "2026-08-18",
    status: "Taslak",
    note: "",
    items: [
      {
        id: 1,
        productId: 2,
        name: "SEO Danışmanlığı",
        qty: 6,
        price: 12500,
        discount: 15,
        vat: 20,
      },
    ],
  },
  {
    id: "TKL-2026-0045",
    customerId: 4,
    date: "2026-08-02",
    validUntil: "2026-08-16",
    status: "Onaylandı",
    note: "",
    items: [
      {
        id: 1,
        productId: 4,
        name: "E-ticaret Entegrasyonu",
        qty: 2,
        price: 28000,
        discount: 0,
        vat: 20,
      },
    ],
  },
];

const nav = [
  { id: "dashboard" as Screen, label: "Genel Bakış", icon: LayoutDashboard },
  { id: "customers" as Screen, label: "Müşteriler", icon: Users },
  { id: "products" as Screen, label: "Ürün & Hizmetler", icon: Box },
  { id: "quotes" as Screen, label: "Teklifler", icon: FileText },
];

function quoteTotals(items: QuoteItem[]) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const discount = items.reduce(
    (s, i) => s + (i.qty * i.price * i.discount) / 100,
    0,
  );
  const vat = items.reduce(
    (s, i) => s + (i.qty * i.price * (1 - i.discount / 100) * i.vat) / 100,
    0,
  );
  return { subtotal, discount, vat, total: subtotal - discount + vat };
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [customers, setCustomers] = useState<Customer[]>(starterCustomers);
  const [products, setProducts] = useState<Product[]>(starterProducts);
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [settings, setSettings] = useState<WorkspaceSettings>(defaultSettings);
  const [selectedQuote, setSelectedQuote] = useState<string>(
    initialQuotes[0].id,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [workspaceProfile, setWorkspaceProfile] = useState<WorkspaceProfile | null>(null);
  const [organizationName, setOrganizationName] = useState("Çalışma alanı");
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [onboardingReplayOpen, setOnboardingReplayOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusedCustomerId, setFocusedCustomerId] = useState<number>();
  const [focusedProductId, setFocusedProductId] = useState<number>();
  const [searchDestinationKey, setSearchDestinationKey] = useState(0);
  const [quickCreate, setQuickCreate] = useState<"customer" | "product" | null>(null);
  const [quickCreateKey, setQuickCreateKey] = useState(0);
  const [searchRecord, setSearchRecord] = useState<{ kind: "customer"; record: Customer } | { kind: "product"; record: Product } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr-TR");
    if (query.length < 2) return [];
    return [
      ...customers
        .filter((entry) => `${entry.company} ${entry.name} ${entry.email}`.toLocaleLowerCase("tr-TR").includes(query))
        .slice(0, 4)
        .map((entry) => ({ kind: "customer" as const, id: String(entry.id), label: entry.company, meta: entry.name, record: entry })),
      ...products
        .filter((entry) => `${entry.name} ${entry.code}`.toLocaleLowerCase("tr-TR").includes(query))
        .slice(0, 4)
        .map((entry) => ({ kind: "product" as const, id: String(entry.id), label: entry.name, meta: entry.code, record: entry })),
      ...quotes
        .filter((entry) => entry.id.toLocaleLowerCase("tr-TR").includes(query))
        .slice(0, 4)
        .map((entry) => ({ kind: "quote" as const, id: entry.id, label: entry.id, meta: entry.status })),
    ].slice(0, 8);
  }, [customers, products, quotes, searchQuery]);

  useEffect(() => {
    if (isFirebaseConfigured) return;
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem("teklifio-data");
        if (saved) {
          const d = JSON.parse(saved);
          setCustomers(d.customers);
          setProducts(d.products);
          setQuotes(d.quotes);
        }
      } catch {
        /* örnek verilerle devam et */
      }
      setHydrated(true);
    });
  }, []);
  useEffect(() => {
    if (hydrated && !isFirebaseConfigured)
      localStorage.setItem(
        "teklifio-data",
        JSON.stringify({ customers, products, quotes }),
      );
  }, [customers, products, quotes, hydrated]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const services = getFirebaseServices();
    if (!services) return;
    return onAuthStateChanged(services.auth, (user) => {
      setCurrentUser(user);
      setWorkspaceLoading(Boolean(user));
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return;
    queueMicrotask(() => {
      setWorkspaceLoading(true);
      setSyncError("");
      loadWorkspaceData()
        .then(async (data) => {
          if (data.profile.emailVerificationRequired && !currentUser.emailVerified) return data;
          if (
            runtimeFlags.seedDemoData &&
            !data.customers.length &&
            !data.products.length &&
            !data.quotes.length
          ) {
            const seedWorkspace = async () => {
              await new Promise((resolve) => window.setTimeout(resolve, 1500));
              for (const customer of starterCustomers) await saveCustomer(customer);
              for (const product of starterProducts) await saveProduct(product);
              for (const quote of initialQuotes) await saveQuote(quote);
            };
            await seedWorkspace();
            return loadWorkspaceData();
          }
          return data;
        })
        .then((data) => {
          setCustomers(data.customers);
          setProducts(data.products);
          setQuotes(data.quotes);
          setSettings({ ...defaultSettings, ...data.settings });
          setWorkspaceProfile(data.profile);
          setOrganizationName(data.organizationName);
          setOnboardingCompleted(data.onboardingCompleted);
          if (data.quotes[0]) setSelectedQuote(data.quotes[0].id);
        })
        .catch(async (error: Error) => {
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
          try {
            const recovered = await loadWorkspaceData();
            if (recovered.customers.length || recovered.products.length || recovered.quotes.length) {
              setCustomers(recovered.customers);
              setProducts(recovered.products);
              setQuotes(recovered.quotes);
              setSettings({ ...defaultSettings, ...recovered.settings });
              setWorkspaceProfile(recovered.profile);
              setOrganizationName(recovered.organizationName);
              setOnboardingCompleted(recovered.onboardingCompleted);
              setSyncError("");
              return;
            }
          } catch { /* İlk hata kullanıcıya gösterilir. */ }
          setSyncError(error.message);
        })
        .finally(() => setWorkspaceLoading(false));
    });
  }, [currentUser]);

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("tr-TR") === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
        setSearchOpen(false);
        setSupportOpen(false);
        setOnboardingReplayOpen(false);
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);

  const updateCustomers = (next: Customer[], removedId?: number) => {
    setCustomers(next);
    if (isFirebaseConfigured) {
      next.forEach((customer) =>
        saveCustomer(customer).catch((error: Error) =>
          setSyncError(error.message),
        ),
      );
      if (removedId) deleteCustomer(removedId).catch((error: Error) => setSyncError(error.message));
    }
  };
  const updateProducts = (next: Product[], removedId?: number) => {
    setProducts(next);
    if (isFirebaseConfigured) {
      next.forEach((product) =>
        saveProduct(product).catch((error: Error) =>
          setSyncError(error.message),
        ),
      );
      if (removedId) deleteProduct(removedId).catch((error: Error) => setSyncError(error.message));
    }
  };
  const updateSettings = async (next: WorkspaceSettings) => {
    setSettings(next);
    if (isFirebaseConfigured) await saveWorkspaceSettings(next);
  };
  const addQuote = (quote: Quote) => {
    setQuotes([quote, ...quotes]);
    if (isFirebaseConfigured) {
      saveQuote(quote).catch((error: Error) => setSyncError(error.message));
    }
  };
  const changeQuoteStatus = async (quoteId: string, status: WorkspaceQuoteStatus) => {
    if (isFirebaseConfigured) await updateQuoteStatus(quoteId, status);
    setQuotes((current) => current.map((quote) => quote.id === quoteId ? { ...quote, status } : quote));
  };

  const finishOnboarding = async (next: WorkspaceSettings) => {
    await updateSettings(next);
    if (isFirebaseConfigured) await completeWorkspaceOnboarding();
    setOnboardingCompleted(true);
  };

  const signOut = async () => {
    setProfileOpen(false);
    const services = getFirebaseServices();
    if (services) await firebaseSignOut(services.auth);
  };

  if (
    authLoading ||
    workspaceLoading ||
    (isFirebaseConfigured && Boolean(currentUser) && !workspaceProfile && !syncError)
  ) {
    return (
      <main className="app-loading">
        <div className="brand-mark"><FileText /></div>
        <h1>Teklifio hazırlanıyor</h1>
        <p>Güvenli çalışma alanınız yükleniyor...</p>
      </main>
    );
  }
  if (isFirebaseConfigured && !currentUser) return <AuthScreen />;
  if (isFirebaseConfigured && currentUser && !workspaceProfile) {
    return (
      <main className="app-error-page" role="alert">
        <AlertTriangle />
        <h1>Çalışma alanı yüklenemedi</h1>
        <p>{syncError || "Çalışma alanınız hazırlanırken beklenmeyen bir sorun oluştu."}</p>
        <div>
          <button type="button" onClick={() => window.location.reload()}><RefreshCw /> Tekrar dene</button>
          <button type="button" onClick={() => void signOut()}>Farklı hesapla giriş yap</button>
        </div>
      </main>
    );
  }
  if (isFirebaseConfigured && currentUser && workspaceProfile?.emailVerificationRequired && !currentUser.emailVerified) {
    return <VerifyEmailScreen email={currentUser.email ?? workspaceProfile.email} />;
  }

  const displayEmail = currentUser?.email ?? "demo@teklifio.com";
  const displayInitials = currentUser?.displayName
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr-TR") || "DÖ";
  const mayEdit = !workspaceProfile || canEditWorkspaceData(workspaceProfile.role);
  const mayManage = !workspaceProfile || canManageWorkspace(workspaceProfile.role);
  const exportWorkspace = () => {
    const payload = { exportedAt: new Date().toISOString(), organization: organizationName, settings, customers, products, quotes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `teklifio-${organizationName.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/g, "-") || "workspace"}-veri.json`;
    anchor.click(); URL.revokeObjectURL(url);
  };

  const go = (next: Screen) => {
    setScreen(next);
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openQuote = (id: string) => {
    setSelectedQuote(id);
    go("quote-detail");
  };
  const openSearchResult = (result: { kind: "customer"; id: string; record: Customer } | { kind: "product"; id: string; record: Product } | { kind: "quote"; id: string }) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchDestinationKey((key) => key + 1);
    if (result.kind === "quote") openQuote(result.id);
    else if (result.kind === "customer") { setSearchRecord({ kind: "customer", record: result.record }); window.setTimeout(() => go("customers"), 0); }
    else { setSearchRecord({ kind: "product", record: result.record }); window.setTimeout(() => go("products"), 0); }
  };

  return (
    <div className="app-shell" style={{ "--primary": settings.primaryColor, "--primary-dark": settings.primaryColor } as React.CSSProperties}>
      {((isFirebaseConfigured && currentUser && !onboardingCompleted) || onboardingReplayOpen) && (
        <Onboarding
          organizationName={organizationName}
          settings={settings}
          onDismiss={onboardingCompleted ? () => setOnboardingReplayOpen(false) : undefined}
          onComplete={async (next) => { await finishOnboarding(next); setOnboardingReplayOpen(false); }}
        />
      )}
      {supportOpen && <SupportPanel
        editable={mayEdit}
        onClose={() => setSupportOpen(false)}
        onReplayOnboarding={() => setOnboardingReplayOpen(true)}
        onNavigate={(action) => {
          if (action === "settings") go("settings");
          if (action === "customers") { if (mayEdit) { setQuickCreate("customer"); setQuickCreateKey((key) => key + 1); } go("customers"); }
          if (action === "products") { if (mayEdit) { setQuickCreate("product"); setQuickCreateKey((key) => key + 1); } go("products"); }
          if (action === "new-quote") go(mayEdit ? "new-quote" : "quotes");
        }}
      />}
      {mobileOpen && (
        <button
          className="scrim"
          aria-label="Menüyü kapat"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            {/* The organization logo is an authenticated, validated local data URL; remote image optimization is intentionally not used. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {settings.logoDataUrl ? <img src={settings.logoDataUrl} alt="Şirket logosu" /> : <FileText size={19} />}
          </div>
          <span>
            teklif<span>io</span>
          </span>
          <button className="mobile-x" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav>
          <p className="nav-label">ÇALIŞMA ALANI</p>
          {nav.filter((item) => mayEdit || item.id !== "new-quote").map((item) => (
            <button
              key={item.id}
              className={
                screen === item.id ||
                (item.id === "quotes" &&
                  ["new-quote", "quote-detail"].includes(screen))
                  ? "active"
                  : ""
              }
              onClick={() => go(item.id)}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.id === "quotes" && <b>{quotes.length}</b>}
            </button>
          ))}
          <p className="nav-label bottom">YÖNETİM</p>
          <button
            className={screen === "settings" ? "active" : ""}
            onClick={() => go("settings")}
          >
            <Settings size={19} />
            <span>Ayarlar</span>
          </button>
          <button onClick={() => { setSupportOpen(true); setMobileOpen(false); }}>
            <LifeBuoy size={19} />
            <span>Yardım ve destek</span>
          </button>
        </nav>
        {mayEdit && <div className="sidebar-help">
          <div className="help-icon">
            <Sparkles size={17} />
          </div>
          <strong>Daha hızlı teklif hazırla</strong>
          <p>
            Ürünlerini ekle, profesyonel teklifini dakikalar içinde oluştur.
          </p>
          <button onClick={() => go("new-quote")}>
            Teklif oluştur <ArrowRight size={14} />
          </button>
        </div>}
        <div className="profile">
          <div className="avatar avatar-dark">{displayInitials}</div>
          <div>
            <strong>{currentUser?.displayName || "Dicle Özgen"}</strong>
            <small>{isFirebaseConfigured ? displayEmail : "Demo yöneticisi"}</small>
          </div>
          {isFirebaseConfigured ? (
            <button className="profile-logout" onClick={signOut} aria-label="Çıkış yap"><LogOut size={17} /></button>
          ) : (
            <MoreHorizontal size={18} />
          )}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu-btn" aria-label="Menüyü aç" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="top-search">
            <Search size={18} />
            <input
              ref={searchInputRef}
              aria-label="Müşteri, teklif veya ürün ara"
              placeholder="Müşteri, teklif veya ürün ara..."
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
            />
            <kbd>⌘ K</kbd>
            {searchOpen && searchQuery.trim().length >= 2 && (
              <div className="search-results" role="listbox" aria-label="Arama sonuçları">
                {searchResults.length ? searchResults.map((result) => (
                  <button
                    key={`${result.kind}-${result.id}`}
                    role="option"
                    aria-selected="false"
                    onClick={() => openSearchResult(result)}
                  >
                    <span>{result.kind === "customer" ? "Müşteri" : result.kind === "product" ? "Ürün" : "Teklif"}</span>
                    <b>{result.label}</b>
                    <small>{result.meta}</small>
                  </button>
                )) : <p>Aramanızla eşleşen kayıt bulunamadı.</p>}
              </div>
            )}
          </div>
          <div className="top-actions">
            {mayEdit && <button className="top-new-quote" onClick={() => go("new-quote")}><Plus size={16} /><span>Yeni teklif</span></button>}
            <button
              className="notification"
              aria-label="Bildirimleri aç"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
                setSearchOpen(false);
              }}
            >
              <Bell size={19} />
              {!notificationsRead && <i />}
            </button>
            {notificationsOpen && (
              <div className="header-menu notification-menu">
                <div className="header-menu-title"><b>Bildirimler</b><span>2 yeni</span></div>
                <button onClick={() => quotes[0] && openQuote(quotes[0].id)}><b>Son teklifiniz hazır</b><small>Teklif detayını görüntüleyin.</small></button>
                <button onClick={() => go("customers")}><b>Müşteri listeniz güncel</b><small>CRM kayıtlarını gözden geçirin.</small></button>
                <button className="menu-text-action" onClick={() => { setNotificationsRead(true); setNotificationsOpen(false); }}>Tümünü okundu işaretle</button>
              </div>
            )}
            <button
              className="header-profile"
              aria-label="Hesap menüsünü aç"
              aria-expanded={profileOpen}
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
                setSearchOpen(false);
              }}
            >
              <div className="avatar avatar-dark">{displayInitials}</div>
              <ChevronDown size={15} />
            </button>
            {profileOpen && (
              <div className="header-menu profile-menu">
                <div className="account-summary"><div className="avatar avatar-dark">{displayInitials}</div><span><b>{currentUser?.displayName || "Dicle Özgen"}</b><small>{displayEmail}</small></span></div>
                <button onClick={() => { setProfileOpen(false); go("settings"); }}><Settings size={16} /><span><b>Hesap ve ayarlar</b><small>Şirket bilgilerini yönetin</small></span></button>
                {isFirebaseConfigured && <button className="logout-menu-action" onClick={signOut}><LogOut size={16} /><span><b>Çıkış yap</b><small>Oturumu güvenle kapat</small></span></button>}
              </div>
            )}
          </div>
        </header>
        <div className="content">
          {syncError && <div className="sync-error"><b>Veri eşitleme hatası:</b> {syncError}</div>}
          {screen === "dashboard" && (
            <Dashboard
              customers={customers}
              products={products}
              quotes={quotes}
              settings={settings}
              onNew={() => go("new-quote")}
              onQuote={openQuote}
              onQuotes={() => go("quotes")}
              onCustomer={() => { setQuickCreate("customer"); setQuickCreateKey((key) => key + 1); go("customers"); }}
              onProduct={() => { setQuickCreate("product"); setQuickCreateKey((key) => key + 1); go("products"); }}
              onSettings={() => go("settings")}
              editable={mayEdit}
            />
          )}
          {screen === "customers" && (
            <Customers key={`customer-${focusedCustomerId || 0}-${searchDestinationKey}-${quickCreateKey}`} customers={customers} quotes={quotes} setCustomers={updateCustomers} focusedId={focusedCustomerId} onClearFocus={() => setFocusedCustomerId(undefined)} initiallyOpen={mayEdit && quickCreate === "customer"} onQuickCreateDone={() => setQuickCreate(null)} editable={mayEdit} />
          )}
          {screen === "products" && (
            <Products key={`product-${focusedProductId || 0}-${searchDestinationKey}-${quickCreateKey}`} products={products} settings={settings} setProducts={updateProducts} focusedId={focusedProductId} onClearFocus={() => setFocusedProductId(undefined)} initiallyOpen={mayEdit && quickCreate === "product"} onQuickCreateDone={() => setQuickCreate(null)} editable={mayEdit} />
          )}
          {screen === "quotes" && (
            <Quotes
              quotes={quotes}
              customers={customers}
              onNew={() => go("new-quote")}
              onOpen={openQuote}
              editable={mayEdit}
            />
          )}
          {screen === "new-quote" && mayEdit && (
            <NewQuote
              customers={customers}
              products={products}
              quotes={quotes}
              settings={settings}
              onCancel={() => go("quotes")}
              onSave={(q) => {
                addQuote(q);
                setSelectedQuote(q.id);
                go("quote-detail");
              }}
            />
          )}
          {screen === "quote-detail" && (
            <QuoteDetail
              quote={quotes.find((q) => q.id === selectedQuote) || quotes[0]}
              customer={customers.find(
                (c) =>
                  c.id ===
                  (quotes.find((q) => q.id === selectedQuote) || quotes[0])
                    .customerId,
              )!}
              settings={settings}
              editable={mayEdit}
              onStatusChange={changeQuoteStatus}
              onBack={() => go("quotes")}
            />
          )}
          {screen === "settings" && <SettingsPage settings={settings} organizationName={organizationName} onSave={updateSettings} currentUser={currentUser} profile={workspaceProfile} canManage={mayManage} onExport={exportWorkspace} onAccountNameChange={async (fullName) => { await updateAccountName(fullName); setWorkspaceProfile((current) => current ? { ...current, fullName } : current); }} />}
        </div>
        {searchRecord?.kind === "customer" && <Modal title={searchRecord.record.company} onClose={() => setSearchRecord(null)}><div className="record-detail"><p><b>Yetkili:</b> {searchRecord.record.name || "Belirtilmedi"}</p><p><b>E-posta:</b> {searchRecord.record.email || "Belirtilmedi"}</p><p><b>Telefon:</b> {searchRecord.record.phone || "Belirtilmedi"}</p><p><b>Adres:</b> {searchRecord.record.address || "Belirtilmedi"}</p><p><b>Vergi:</b> {[searchRecord.record.taxOffice, searchRecord.record.taxNumber].filter(Boolean).join(" · ") || "Belirtilmedi"}</p><p><b>Not:</b> {searchRecord.record.notes || "Belirtilmedi"}</p></div></Modal>}
        {searchRecord?.kind === "product" && <Modal title={searchRecord.record.name} onClose={() => setSearchRecord(null)}><div className="record-detail"><p><b>Kod:</b> {searchRecord.record.code || "Belirtilmedi"}</p><p><b>Tür:</b> {searchRecord.record.type}</p><p><b>Birim:</b> {searchRecord.record.unit}</p><p><b>Birim fiyat:</b> {currency(searchRecord.record.price)}</p><p><b>Varsayılan KDV:</b> %{searchRecord.record.vat}</p><p><b>Açıklama:</b> {searchRecord.record.description || "Belirtilmedi"}</p></div></Modal>}
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} Teklifio</span>
          <nav aria-label="Hukuki bağlantılar">
            <a href="/yardim">Yardım</a>
            <a href="/fiyatlandirma">Fiyatlandırma</a>
            <a href="/gizlilik">Gizlilik</a>
            <a href="/kvkk">KVKK Aydınlatma Metni</a>
            <a href="/kullanim-kosullari">Kullanım Koşulları</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}

function PageHead({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </div>
  );
}

function Dashboard({
  customers,
  products,
  quotes,
  settings,
  onNew,
  onQuote,
  onQuotes,
  onCustomer,
  onProduct,
  onSettings,
  editable,
}: {
  customers: Customer[];
  products: Product[];
  quotes: Quote[];
  settings: WorkspaceSettings;
  onNew: () => void;
  onQuote: (id: string) => void;
  onQuotes: () => void;
  onCustomer: () => void;
  onProduct: () => void;
  onSettings: () => void;
  editable: boolean;
}) {
  const approved = quotes
    .filter((q) => q.status === "Onaylandı")
    .reduce((s, q) => s + quoteTotals(q.items).total, 0);
  const setupSteps = [
    { label: "Şirket bilgilerini tamamla", done: Boolean(settings.companyName.trim() && settings.email.trim()), action: onSettings },
    { label: "İlk müşterini ekle", done: customers.length > 0, action: onCustomer },
    { label: "Ürün veya hizmet ekle", done: products.length > 0, action: onProduct },
    { label: "İlk teklifini oluştur", done: quotes.length > 0, action: onNew },
  ];
  const completedSetup = setupSteps.filter((item) => item.done).length;
  return (
    <>
      <PageHead
        eyebrow="8 AĞUSTOS 2026, CUMARTESİ"
        title="Günaydın, Dicle 👋"
        copy="İşlerin iyi görünüyor. Bugünkü teklif performansına göz at."
        action={editable ?
          <button className="primary" onClick={onNew}>
            <Plus size={18} /> Yeni teklif
          </button>
        : undefined}
      />
      <section className="metrics">
        <Metric
          icon={<CircleDollarSign />}
          tone="violet"
          label="Toplam ciro"
          value={currency(approved)}
          trend="12,5%"
          detail="geçen aya göre"
        />
        <Metric
          icon={<FileText />}
          tone="blue"
          label="Aktif teklifler"
          value={String(quotes.filter((q) => q.status === "Taslak" || q.status === "Gönderildi").length)}
          trend="2 yeni"
          detail="bu hafta"
        />
        <Metric
          icon={<CheckCircle2 />}
          tone="green"
          label="Kazanma oranı"
          value="%68"
          trend="5,2%"
          detail="geçen aya göre"
        />
        <Metric
          icon={<Users />}
          tone="orange"
          label="Toplam müşteri"
          value={String(customers.length)}
          trend="3 yeni"
          detail="bu ay"
        />
      </section>
      <section className="panel setup-checklist"><div><span className="eyebrow">BAŞLANGIÇ KONTROLÜ</span><h3>Çalışma alanı kurulumu</h3><p>{completedSetup}/4 adım tamamlandı</p></div><div>{setupSteps.map((item) => <button className={item.done ? "done" : ""} key={item.label} onClick={item.action}>{item.done ? <CheckCircle2 /> : <Clock3 />}<span>{item.label}</span><ArrowRight /></button>)}</div></section>
      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-head">
            <div>
              <h3>Gelir özeti</h3>
              <p>Son 6 aylık onaylanan teklifler</p>
            </div>
            <span className="chart-period">Son 6 ay</span>
          </div>
          <div className="chart">
            <div className="y-labels">
              <span>₺120K</span>
              <span>₺90K</span>
              <span>₺60K</span>
              <span>₺30K</span>
              <span>₺0</span>
            </div>
            <div className="bars">
              {[
                ["Mar", 42],
                ["Nis", 60],
                ["May", 52],
                ["Haz", 78],
                ["Tem", 68],
                ["Ağu", 94],
              ].map(([m, h], i) => (
                <div className="bar-col" key={String(m)}>
                  <div
                    className={`bar ${i === 5 ? "hot" : ""}`}
                    style={{ height: `${h}%` }}
                  >
                    <span>{i === 5 ? "₺112K" : ""}</span>
                  </div>
                  <small>{m}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel target-panel">
          <div className="panel-head">
            <div>
              <h3>Aylık hedef</h3>
              <p>Ağustos 2026</p>
            </div>
          </div>
          <div
            className="ring"
            style={{ "--progress": "74%" } as React.CSSProperties}
          >
            <div>
              <b>%74</b>
              <span>tamamlandı</span>
            </div>
          </div>
          <strong>
            {currency(148000)} <span>/ {currency(200000)}</span>
          </strong>
          <p>
            Hedefe ulaşmak için <b>{currency(52000)}</b> kaldı
          </p>
          <div className="target-note">
            <TrendingUp size={16} /> Geçen aydan %18 daha iyi
          </div>
        </div>
      </section>
      <section className="panel recent">
        <div className="panel-head">
          <div>
            <h3>Son teklifler</h3>
            <p>En son oluşturulan tekliflerin</p>
          </div>
          <button className="text-btn" onClick={onQuotes}>
            Tümünü gör <ArrowRight size={15} />
          </button>
        </div>
        <QuoteTable
          quotes={quotes.slice(0, 4)}
          customers={customers}
          onOpen={onQuote}
        />
      </section>
      {editable && <section className="quick-row">
        <div>
          <h3>Hızlı işlemler</h3>
          <p>Sık kullandığın işlemlere kolayca ulaş.</p>
        </div>
        <button onClick={onNew}>
          <span className="quick-icon violet">
            <FileText />
          </span>
          <div>
            <strong>Yeni teklif</strong>
            <small>Profesyonel teklif hazırla</small>
          </div>
          <ArrowRight />
        </button>
        <button onClick={onCustomer}>
          <span className="quick-icon blue">
            <UserPlus />
          </span>
          <div>
            <strong>Müşteri ekle</strong>
            <small>Portföyüne yeni müşteri ekle</small>
          </div>
          <ArrowRight />
        </button>
        <button onClick={onProduct}>
          <span className="quick-icon orange">
            <PackagePlus />
          </span>
          <div>
            <strong>Ürün ekle</strong>
            <small>Kataloğuna ürün ekle</small>
          </div>
          <ArrowRight />
        </button>
      </section>}
    </>
  );
}

function Metric({
  icon,
  tone,
  label,
  value,
  trend,
  detail,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
  trend: string;
  detail: string;
}) {
  return (
    <div className="metric">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <p>{label}</p>
      <h2>{value}</h2>
      <div>
        <span className="trend">
          <TrendingUp size={13} />
          {trend}
        </span>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function Customers({
  customers,
  quotes,
  setCustomers,
  focusedId,
  onClearFocus,
  initiallyOpen,
  onQuickCreateDone,
  editable,
}: {
  customers: Customer[];
  quotes: Quote[];
  setCustomers: (v: Customer[], removedId?: number) => void;
  focusedId?: number;
  onClearFocus: () => void;
  initiallyOpen?: boolean;
  onQuickCreateDone: () => void;
  editable: boolean;
}) {
  const [editing, setEditing] = useState<Customer | "new" | null>(initiallyOpen ? "new" : null);
  const [importRows, setImportRows] = useState<CsvPreviewRow[] | null>(null);
  const [detail, setDetail] = useState<Customer | null>(null);
  const shownDetail = detail ?? customers.find((item) => item.id === focusedId) ?? null;
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    company: "",
    name: "",
    email: "",
    phone: "", address: "", taxOffice: "", taxNumber: "", notes: "",
  });
  const filtered = customers.filter((c) =>
    `${c.name} ${c.company} ${c.email}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const closeEditing = () => { if (editing === "new") onQuickCreateDone(); setEditing(null); };
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim()) return;
    const initials = form.company
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const record = { id: editing === "new" ? Date.now() : editing!.id, ...form, initials, color: editing === "new" ? "indigo" : editing!.color };
    setCustomers(editing === "new" ? [...customers, record] : customers.map((item) => item.id === record.id ? record : item));
    closeEditing();
  };
  return (
    <>
      <PageHead
        title="Müşteriler"
        copy={`${customers.length} müşteri kaydı · İlişkilerini tek yerden yönet.`}
        action={editable ?
          <div className="page-actions"><CsvImportButton label="CSV içe aktar" onRead={(text) => setImportRows(previewCustomerCsv(text, customers))} /><button className="primary" onClick={() => { setForm({ company: "", name: "", email: "", phone: "", address: "", taxOffice: "", taxNumber: "", notes: "" }); setEditing("new"); }}>
            <Plus size={18} /> Müşteri ekle
          </button></div>
        : undefined}
      />
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Müşterilerde ara..."
          />
        </div>
      </div>
      <div className="customer-grid">
        {filtered.map((c) => (
          <article className="customer-card" key={c.id}>
            <div className="card-top">
              <div className={`company-logo ${c.color}`}>{c.initials}</div>
              <div className="record-actions">
                <button onClick={() => setDetail(c)}>Detay</button>
                {editable && <><button aria-label={`${c.company} müşterisini düzenle`} onClick={(event) => { event.stopPropagation(); setForm({ company: c.company, name: c.name, email: c.email, phone: c.phone, address: c.address || "", taxOffice: c.taxOffice || "", taxNumber: c.taxNumber || "", notes: c.notes || "" }); setEditing(c); }}>Düzenle</button>
                <button className="danger-link" aria-label={`${c.company} müşterisini sil`} onClick={(event) => { event.stopPropagation(); if (quotes.some((quote) => quote.customerId === c.id)) { window.alert("Teklifi bulunan müşteri silinemez."); return; } if (window.confirm(`${c.company} silinsin mi?`)) setCustomers(customers.filter((item) => item.id !== c.id), c.id); }}>Sil</button></>}
              </div>
            </div>
            <h3>{c.company}</h3>
            <p>{c.name}</p>
            <div className="contact">
              <span>{c.email}</span>
              <span>{c.phone}</span>
            </div>
            <div className="card-foot">
              <small>Son teklif</small>
              <b>{c.id % 2 ? "6 Ağustos 2026" : "2 Ağustos 2026"}</b>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <Modal title={editing === "new" ? "Yeni müşteri" : "Müşteriyi düzenle"} onClose={closeEditing}>
          <form onSubmit={add} className="form-grid">
            <label>
              Şirket adı
              <input
                autoFocus
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </label>
            <label className="full">Adres<textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label>Vergi dairesi<input value={form.taxOffice} onChange={(e) => setForm({ ...form, taxOffice: e.target.value })} /></label>
            <label>Vergi numarası<input value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} /></label>
            <label className="full">Notlar<textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <label>
              Yetkili kişi
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              E-posta
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Telefon
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={closeEditing}
              >
                Vazgeç
              </button>
              <button className="primary">{editing === "new" ? "Müşteriyi ekle" : "Değişiklikleri kaydet"}</button>
            </div>
          </form>
        </Modal>
      )}
      {shownDetail && <Modal title={shownDetail.company} onClose={() => { setDetail(null); onClearFocus(); }}><div className="record-detail"><p><b>Yetkili:</b> {shownDetail.name || "Belirtilmedi"}</p><p><b>E-posta:</b> {shownDetail.email || "Belirtilmedi"}</p><p><b>Telefon:</b> {shownDetail.phone || "Belirtilmedi"}</p><p><b>Adres:</b> {shownDetail.address || "Belirtilmedi"}</p><p><b>Vergi:</b> {[shownDetail.taxOffice, shownDetail.taxNumber].filter(Boolean).join(" · ") || "Belirtilmedi"}</p><p><b>Not:</b> {shownDetail.notes || "Belirtilmedi"}</p></div></Modal>}
      {importRows && <CsvImportPreview title="Müşteri CSV önizlemesi" rows={importRows} onClose={() => setImportRows(null)} onConfirm={() => { const now = Date.now(); const records = importRows.filter((row) => !row.duplicate && !row.errors.length).map((row, index) => ({ id: now + index, ...row.values, initials: row.values.company.split(" ").map((part) => part[0]).join("").slice(0, 2).toLocaleUpperCase("tr-TR"), color: "indigo" } as Customer)); setCustomers([...customers, ...records]); setImportRows(null); }} />}
    </>
  );
}

function Products({
  products,
  settings,
  setProducts,
  focusedId,
  onClearFocus,
  initiallyOpen,
  onQuickCreateDone,
  editable,
}: {
  products: Product[];
  settings: WorkspaceSettings;
  setProducts: (v: Product[], removedId?: number) => void;
  focusedId?: number;
  onClearFocus: () => void;
  initiallyOpen?: boolean;
  onQuickCreateDone: () => void;
  editable: boolean;
}) {
  const [editing, setEditing] = useState<Product | "new" | null>(initiallyOpen ? "new" : null);
  const [importRows, setImportRows] = useState<CsvPreviewRow[] | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const shownDetail = detail ?? products.find((item) => item.id === focusedId) ?? null;
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "Hizmet" as "Hizmet" | "Ürün",
    price: 0,
    vat: 20,
    unit: "Adet",
    description: "",
  });
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price < 0 || form.vat < 0 || form.vat > 100) return;
    const record = { id: editing === "new" ? Date.now() : editing!.id, ...form };
    setProducts(editing === "new" ? [...products, record] : products.map((item) => item.id === record.id ? record : item));
    if (editing === "new") onQuickCreateDone();
    setEditing(null);
  };
  return (
    <>
      <PageHead
        title="Ürün & Hizmetler"
        copy="Tekliflerinde kullandığın ürün ve hizmet kataloğu."
        action={editable ?
          <div className="page-actions"><CsvImportButton label="CSV içe aktar" onRead={(text) => setImportRows(previewProductCsv(text, products))} /><button className="primary" onClick={() => { setForm({ name: "", code: "", type: "Hizmet", price: 0, vat: 20, unit: "Adet", description: "" }); setEditing("new"); }}>
            <Plus size={18} /> Ürün veya hizmet ekle
          </button></div>
        : undefined}
      />
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Katalogda ara..."
          />
        </div>
      </div>
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>ÜRÜN / HİZMET</th>
              <th>TÜR</th>
              <th>BİRİM</th>
              <th>BİRİM FİYAT</th>
              <th>KDV</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products
              .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
              .map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="product-name">
                      <span>
                        <Box size={17} />
                      </span>
                      <div>
                        <button className="record-name-button" onClick={() => setDetail(p)}><b>{p.name}</b></button>
                        <small>{p.code}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`type-pill ${p.type === "Hizmet" ? "service" : "product"}`}
                    >
                      {p.type}
                    </span>
                  </td>
                  <td>{p.unit}</td>
                  <td>
                    <b>{currency(p.price)}</b>
                  </td>
                  <td>%{p.vat}</td>
                  <td>
                    {editable && <div className="record-actions"><button onClick={() => { setForm({ name: p.name, code: p.code, type: p.type, price: p.price, vat: p.vat, unit: p.unit, description: p.description || "" }); setEditing(p); }}>Düzenle</button><button className="danger-link" onClick={() => { if (window.confirm(`${p.name} silinsin mi?`)) setProducts(products.filter((item) => item.id !== p.id), p.id); }}>Sil</button></div>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <Modal title={editing === "new" ? "Ürün veya hizmet ekle" : "Ürün veya hizmeti düzenle"} onClose={() => { if (editing === "new") onQuickCreateDone(); setEditing(null); }}>
          <form onSubmit={add} className="form-grid">
            <label className="full">
              Adı
              <input
                autoFocus
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Ürün kodu
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </label>
            <label>
              Tür
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as "Ürün" | "Hizmet",
                  })
                }
              >
                <option>Hizmet</option>
                <option>Ürün</option>
              </select>
            </label>
            <label>
              Birim fiyat
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Varsayılan KDV
              <select
                value={form.vat}
                onChange={(e) =>
                  setForm({ ...form, vat: Number(e.target.value) })
                }
              >{settings.vatRates.map((rate) => <option key={rate} value={rate}>%{rate}</option>)}</select>
            </label>
            <label>Birim<select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option>Adet</option><option>Ay</option><option>Saat</option><option>Proje</option><option>Paket</option></select></label>
            <label className="full">Açıklama<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => { if (editing === "new") onQuickCreateDone(); setEditing(null); }}
              >
                Vazgeç
              </button>
              <button className="primary">{editing === "new" ? "Kataloğa ekle" : "Değişiklikleri kaydet"}</button>
            </div>
          </form>
        </Modal>
      )}
      {shownDetail && <Modal title={shownDetail.name} onClose={() => { setDetail(null); onClearFocus(); }}><div className="record-detail"><p><b>Kod:</b> {shownDetail.code || "Belirtilmedi"}</p><p><b>Tür:</b> {shownDetail.type}</p><p><b>Birim:</b> {shownDetail.unit}</p><p><b>Birim fiyat:</b> {currency(shownDetail.price)}</p><p><b>Varsayılan KDV:</b> %{shownDetail.vat}</p><p><b>Açıklama:</b> {shownDetail.description || "Belirtilmedi"}</p></div></Modal>}
      {importRows && <CsvImportPreview title="Ürün/hizmet CSV önizlemesi" rows={importRows} onClose={() => setImportRows(null)} onConfirm={() => { const now = Date.now(); const records = importRows.filter((row) => !row.duplicate && !row.errors.length).map((row, index) => ({ id: now + index, name: row.values.name, code: row.values.code, type: row.values.type as "Ürün" | "Hizmet", price: Number(row.values.price), vat: Number(row.values.vat), unit: row.values.unit, description: row.values.description })); setProducts([...products, ...records]); setImportRows(null); }} />}
    </>
  );
}

function Quotes({
  quotes,
  customers,
  onNew,
  onOpen,
  editable,
}: {
  quotes: Quote[];
  customers: Customer[];
  onNew: () => void;
  onOpen: (id: string) => void;
  editable: boolean;
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkspaceQuoteStatus>("all");
  const filteredQuotes = quotes.filter((quote) => {
    if (statusFilter !== "all" && quote.status !== statusFilter) return false;
    const customer = customers.find((item) => item.id === quote.customerId);
    return `${quote.id} ${customer?.company ?? ""}`
      .toLocaleLowerCase("tr-TR")
      .includes(q.toLocaleLowerCase("tr-TR"));
  });
  return (
    <>
      <PageHead
        title="Teklifler"
        copy="Tüm tekliflerini takip et, durumlarını yönet."
        action={editable ?
          <button className="primary" onClick={onNew}>
            <Plus size={18} /> Yeni teklif
          </button>
        : undefined}
      />
      <div className="summary-chips">
        <button
          type="button"
          className={statusFilter === "Taslak" ? "active" : ""}
          aria-pressed={statusFilter === "Taslak"}
          onClick={() => setStatusFilter("Taslak")}
        >
          <FileText />
          <span><small>Taslaklar</small><b>{quotes.filter((x) => x.status === "Taslak").length}</b></span>
        </button>
        <button
          type="button"
          className={statusFilter === "all" ? "active" : ""}
          aria-pressed={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        >
          <FileText />
          <span>
            <small>Tüm teklifler</small>
            <b>{quotes.length}</b>
          </span>
        </button>
        <button
          type="button"
          className={statusFilter === "Reddedildi" ? "active" : ""}
          aria-pressed={statusFilter === "Reddedildi"}
          onClick={() => setStatusFilter("Reddedildi")}
        >
          <X />
          <span><small>Reddedilen</small><b>{quotes.filter((x) => x.status === "Reddedildi").length}</b></span>
        </button>
        <button
          type="button"
          className={statusFilter === "Gönderildi" ? "active" : ""}
          aria-pressed={statusFilter === "Gönderildi"}
          onClick={() => setStatusFilter("Gönderildi")}
        >
          <Clock3 />
          <span>
            <small>Bekleyen</small>
            <b>{quotes.filter((x) => x.status === "Gönderildi").length}</b>
          </span>
        </button>
        <button
          type="button"
          className={statusFilter === "Onaylandı" ? "active" : ""}
          aria-pressed={statusFilter === "Onaylandı"}
          onClick={() => setStatusFilter("Onaylandı")}
        >
          <CheckCircle2 />
          <span>
            <small>Onaylanan</small>
            <b>{quotes.filter((x) => x.status === "Onaylandı").length}</b>
          </span>
        </button>
      </div>
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Teklif numarası veya müşteri ara..."
          />
        </div>
      </div>
      <div className="panel table-panel">
        <QuoteTable
          quotes={filteredQuotes}
          customers={customers}
          onOpen={onOpen}
        />
      </div>
    </>
  );
}

function QuoteTable({
  quotes,
  customers,
  onOpen,
}: {
  quotes: Quote[];
  customers: Customer[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>TEKLİF NO</th>
            <th>MÜŞTERİ</th>
            <th>TARİH</th>
            <th>TUTAR</th>
            <th>DURUM</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => {
            const c = customers.find((x) => x.id === q.customerId);
            return (
              <tr key={q.id} onClick={() => onOpen(q.id)} className="click-row">
                <td>
                  <b className="quote-id">{q.id}</b>
                </td>
                <td>
                  <div className="mini-customer">
                    <div className={`avatar ${c?.color}`}>{c?.initials}</div>
                    <span>
                      <b>{c?.company}</b>
                      <small>{c?.name}</small>
                    </span>
                  </div>
                </td>
                <td>
                  {new Date(q.date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td>
                  <b>{currency(quoteTotals(q.items).total, q.currency)}</b>
                </td>
                <td>
                  <Status status={q.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Status({ status }: { status: Quote["status"] }) {
  return (
    <span
      className={`status ${status.toLowerCase().replace("ı", "i").replace("ö", "o")}`}
    >
      <i />
      {status}
    </span>
  );
}

function NewQuote({
  customers,
  products,
  quotes,
  settings,
  onCancel,
  onSave,
}: {
  customers: Customer[];
  products: Product[];
  quotes: Quote[];
  settings: WorkspaceSettings;
  onCancel: () => void;
  onSave: (q: Quote) => void;
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || 0);
  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: 1,
      productId: products[0]?.id || 0,
      name: products[0]?.name || "",
      qty: 1,
      price: products[0]?.price || 0,
      discount: 0,
      vat: products[0]?.vat ?? settings.defaultVat,
    },
  ]);
  const [date, setDate] = useState(today());
  const [validUntil, setValid] = useState(later(settings.validityDays));
  const [note, setNote] = useState(settings.defaultNote);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPreview, setAiPreview] = useState<AiQuoteDraft | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<"openai" | "mock" | "mock-fallback" | "">("");
  const totals = useMemo(() => quoteTotals(items), [items]);
  const aiTotals = useMemo(
    () =>
      quoteTotals(
        (aiPreview?.items ?? []).map((item, index) => ({
          ...item,
          id: index,
        })),
      ),
    [aiPreview],
  );
  const update = (id: number, key: keyof QuoteItem, value: string | number) =>
    setItems(items.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
  const chooseProduct = (id: number, pid: number) => {
    const p = products.find((p) => p.id === pid)!;
    setItems(
      items.map((i) =>
        i.id === id
          ? { ...i, productId: p.id, name: p.name, price: p.price, vat: p.vat }
          : i,
      ),
    );
  };
  const save = (status: Quote["status"]) => {
    if (!customerId || !items.length || items.some((item) => item.qty <= 0 || item.price < 0 || item.discount < 0 || item.discount > 100 || item.vat < 0 || item.vat > 100)) {
      window.alert("Müşteri ve teklif kalemlerindeki adet, fiyat, indirim ve KDV değerlerini kontrol edin."); return;
    }
    onSave({
      id: `${settings.quotePrefix || "TKL"}-${new Date().getFullYear()}-${String(49 + quotes.length - 4).padStart(4, "0")}`,
      customerId,
      date,
      validUntil,
      status,
      items,
      note,
      currency: settings.currency,
    });
  };
  const analyzeWithAi = async () => {
    setAiLoading(true);
    try {
      if (!isFirebaseConfigured) {
        setAiPreview(deterministicQuoteAi.parse(aiPrompt, customers, products));
        return;
      }
      const services = getFirebaseServices();
      const idToken = await services?.auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Firebase oturumu bulunamadı.");
      const response = await fetch("/api/ai-quote", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const result = (await response.json()) as AiQuoteApiResponse;
      if (!response.ok) throw new Error("AI analizi tamamlanamadı.");
      setAiMode((response.headers.get("X-AI-Mode") || "") as typeof aiMode);
      setAiPreview(apiResponseToDraft(result, customers, products));
    } catch (error) {
      setAiPreview({
        customer: null,
        items: [],
        note: "",
        errors: [error instanceof Error ? error.message : "AI analizi tamamlanamadı."],
      });
    } finally {
      setAiLoading(false);
    }
  };
  const applyAiPreview = () => {
    if (!aiPreview?.customer || !aiPreview.items.length || aiPreview.errors.length)
      return;
    setCustomerId(aiPreview.customer.id);
    setItems(
      aiPreview.items.map((item, index) => ({
        ...item,
        id: Date.now() + index,
      })),
    );
    setNote(aiPreview.note);
    setAiOpen(false);
    setAiPreview(null);
  };
  return (
    <>
      <div className="builder-head">
        <button className="back-btn" onClick={onCancel}>
          <ArrowLeft />
        </button>
        <div>
          <span className="eyebrow">YENİ TEKLİF</span>
          <h1>Profesyonel teklif oluştur</h1>
          <p>Müşterini ve ürünlerini seç, tutarları biz hesaplayalım.</p>
        </div>
        <div className="builder-actions">
          <button
            className="ai-button"
            onClick={() => {
              setAiOpen(true);
              setAiPreview(null);
            }}
          >
            <Sparkles size={16} /> AI ile Oluştur
          </button>
          <button className="secondary" onClick={() => save("Taslak")}>
            Taslak kaydet
          </button>
          <button className="primary" onClick={() => save("Gönderildi")}>
            Teklifi oluştur <ArrowRight />
          </button>
        </div>
      </div>
      <div className="builder-grid">
        <div className="builder-main">
          <section className="panel form-section">
            <div className="section-title">
              <span>1</span>
              <div>
                <h3>Müşteri bilgileri</h3>
                <p>Teklifin gönderileceği müşteriyi seç.</p>
              </div>
            </div>
            <label>
              Müşteri
              <select
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} — {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="two-col">
              <label>
                Teklif tarihi
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                Geçerlilik tarihi
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValid(e.target.value)}
                />
              </label>
            </div>
          </section>
          <section className="panel form-section">
            <div className="section-title">
              <span>2</span>
              <div>
                <h3>Ürün ve hizmetler</h3>
                <p>Teklife dahil edilecek kalemleri ekle.</p>
              </div>
            </div>
            <div className="item-head">
              <span>ÜRÜN / HİZMET</span>
              <span>ADET</span>
              <span>BİRİM FİYAT</span>
              <span>İNDİRİM</span>
              <span>KDV</span>
              <span>TUTAR</span>
              <span />
            </div>
            {items.map((item) => (
              <div className="item-row" key={item.id}>
                <select
                  value={item.productId}
                  onChange={(e) =>
                    chooseProduct(item.id, Number(e.target.value))
                  }
                >
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Adet"
                  type="number"
                  min="1"
                  step="0.01"
                  value={item.qty}
                  onChange={(e) =>
                    update(item.id, "qty", Number(e.target.value))
                  }
                />
                <div className="money-input">
                  <span>₺</span>
                  <input
                    aria-label="Birim fiyat"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) =>
                      update(item.id, "price", Number(e.target.value))
                    }
                  />
                </div>
                <div className="money-input">
                  <input
                    aria-label="İndirim"
                    type="number"
                    min="0"
                    max="100"
                    value={item.discount}
                    onChange={(e) =>
                      update(item.id, "discount", Number(e.target.value))
                    }
                  />
                  <span>%</span>
                </div>
                <select
                  aria-label="KDV"
                  value={item.vat}
                  onChange={(e) =>
                    update(item.id, "vat", Number(e.target.value))
                  }
                >
                  {settings.vatRates.map((rate) => <option value={rate} key={rate}>%{rate}</option>)}
                </select>
                <b>
                  {currency(
                    item.qty *
                      item.price *
                      (1 - item.discount / 100) *
                      (1 + item.vat / 100), settings.currency)}
                </b>
                <button
                  aria-label="Kalemi sil"
                  onClick={() =>
                    items.length > 1 &&
                    setItems(items.filter((i) => i.id !== item.id))
                  }
                >
                  <Trash2 />
                </button>
              </div>
            ))}
            <button
              className="add-row"
              onClick={() => {
                const p = products[0];
                setItems([
                  ...items,
                  {
                    id: Date.now(),
                    productId: p.id,
                    name: p.name,
                    qty: 1,
                    price: p.price,
                    discount: 0,
                    vat: p.vat,
                  },
                ]);
              }}
            >
              <Plus /> Yeni kalem ekle
            </button>
          </section>
          <section className="panel form-section">
            <div className="section-title">
              <span>3</span>
              <div>
                <h3>Notlar</h3>
                <p>Teklifin sonuna eklenecek kısa bir not.</p>
              </div>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn. İş birliğiniz için teşekkür ederiz..."
              rows={4}
            />
          </section>
        </div>
        <aside className="quote-summary">
          <div className="panel">
            <div className="summary-head">
              <span>
                <ClipboardList />
              </span>
              <div>
                <h3>Teklif özeti</h3>
                <p>{items.length} kalem</p>
              </div>
            </div>
            <div className="summary-lines">
              <div>
                <span>Ara toplam</span>
                <b>{currency(totals.subtotal, settings.currency)}</b>
              </div>
              <div>
                <span>İndirim</span>
                <b className="discount">− {currency(totals.discount, settings.currency)}</b>
              </div>
              <div>
                <span>KDV</span>
                <b>{currency(totals.vat, settings.currency)}</b>
              </div>
            </div>
            <div className="grand">
              <span>Genel toplam</span>
              <b>{currency(totals.total, settings.currency)}</b>
              <small>KDV dahil</small>
            </div>
            <div className="safe-note">
              <CheckCircle2 /> Tüm hesaplamalar otomatik yapılır.
            </div>
          </div>
        </aside>
      </div>
      {aiOpen && (
        <Modal
          title="AI ile teklif oluştur"
          onClose={() => {
            setAiOpen(false);
            setAiPreview(null);
          }}
        >
          <div className="ai-modal">
            <div className="ai-intro">
              <span>
                <Sparkles size={18} />
              </span>
              <div>
                <b>Talebi doğal dille anlat</b>
                <p>
                  Müşteri ve ürünleri mevcut kayıtlarından eşleştirir; yeni veri
                  uydurmaz.
                </p>
              </div>
            </div>
            <div className="ai-legal-warning" role="note">
              AI tarafından oluşturulan teklifler taslaktır. Göndermeden önce
              fiyat, ürün/hizmet, vergi ve müşteri bilgilerini kontrol ediniz.
            </div>
            <label>
              Müşteri talebi
              <textarea
                aria-label="Müşteri talebi"
                value={aiPrompt}
                onChange={(event) => {
                  setAiPrompt(event.target.value);
                  setAiPreview(null);
                }}
                rows={5}
                placeholder="Örn. Nova Teknoloji için 2 adet Kurumsal Web Sitesi..."
              />
            </label>
            {!aiPreview && (
              <button
                className="primary ai-analyze"
                onClick={analyzeWithAi}
                disabled={!aiPrompt.trim() || aiLoading}
              >
                <Sparkles size={16} /> {aiLoading ? "Analiz ediliyor..." : "Talebi Analiz Et"}
              </button>
            )}
            {aiPreview && (
              <div className="ai-preview" aria-label="AI teklif önizlemesi">
                <div className="ai-preview-head">
                  <div>
                    <span className="eyebrow">AI ÖNİZLEME</span>
                    <h3>Teklif taslağı hazır</h3>
                  </div>
                  {!aiPreview.errors.length && (
                    <span className="ai-ready">
                      <CheckCircle2 size={14} /> {aiMode === "openai" ? "Gerçek OpenAI · eşleşmeler hazır" : "Yerel analiz · eşleşmeler hazır"}
                    </span>
                  )}
                </div>
                {aiPreview.errors.length > 0 ? (
                  <div className="ai-errors">
                    {aiPreview.errors.map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                    <small>
                      Yazımı kontrol edin veya katalogdaki tam adları kullanın.
                    </small>
                  </div>
                ) : (
                  <>
                    <div className="ai-customer-match">
                      <span>MÜŞTERİ</span>
                      <b>{aiPreview.customer?.company}</b>
                      <small>{aiPreview.customer?.name}</small>
                    </div>
                    <div className="ai-item-list">
                      {aiPreview.items.map((item) => (
                        <div key={item.productId}>
                          <span>
                            <b>{item.name}</b>
                            <small>
                              {item.qty} adet · {currency(item.price)} · İndirim
                              %{item.discount} · KDV %{item.vat}
                            </small>
                          </span>
                          <strong>
                            {currency(
                              item.qty *
                                item.price *
                                (1 - item.discount / 100) *
                                (1 + item.vat / 100),
                            )}
                          </strong>
                        </div>
                      ))}
                    </div>
                    <div className="ai-total">
                      <span>Genel toplam</span>
                      <b>{currency(aiTotals.total, settings.currency)}</b>
                    </div>
                    {aiPreview.note && (
                      <div className="ai-note">
                        <b>Teklif notu</b>
                        <p>{aiPreview.note}</p>
                      </div>
                    )}
                  </>
                )}
                <div className="ai-preview-actions">
                  <button
                    className="secondary"
                    onClick={() => setAiPreview(null)}
                  >
                    Metni Düzenle
                  </button>
                  <button
                    className="primary"
                    onClick={applyAiPreview}
                    disabled={
                      aiPreview.errors.length > 0 || !aiPreview.customer
                    }
                  >
                    <Check size={16} /> Teklife Uygula
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

function QuoteDetail({
  quote,
  customer,
  settings,
  onBack,
  editable,
  onStatusChange,
}: {
  quote: Quote;
  customer: Customer;
  settings: WorkspaceSettings;
  onBack: () => void;
  editable: boolean;
  onStatusChange: (quoteId: string, status: WorkspaceQuoteStatus) => Promise<void>;
}) {
  const totals = quoteTotals(quote.items);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");
  const [shares, setShares] = useState<QuoteShare[]>([]);
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [activities, setActivities] = useState<QuoteActivity[]>([]);
  const [statusBusy, setStatusBusy] = useState(false);
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    queueMicrotask(() => Promise.all([loadQuoteShares(quote.id), loadQuoteVersions(quote.id), loadQuoteActivities(quote.id)]).then(([nextShares, nextVersions, nextActivities]) => { setShares(nextShares); setVersions(nextVersions); setActivities(nextActivities); }).catch(() => undefined));
  }, [quote.id]);
  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadQuotePdf(quote, customer, settings);
      await logQuoteActivity(quote.id, "pdf_downloaded").catch(() => undefined);
      setActivities((current) => [{ id: crypto.randomUUID(), quoteId: quote.id, organizationId: "", actorId: "", type: "pdf_downloaded" }, ...current]);
    } finally {
      setPdfLoading(false);
    }
  };
  const shareQuote = async () => {
    setShareBusy(true); setShareError(""); setShareMessage("");
    try { const share = await createQuoteShare({ quote, customer, settings }); await logQuoteActivity(quote.id, "share_created").catch(() => undefined); const url = `${window.location.origin}/teklif#${share.token}`; await navigator.clipboard.writeText(url); setShares((current) => [share, ...current]); setActivities((current) => [{ id: crypto.randomUUID(), quoteId: quote.id, organizationId: "", actorId: "", type: "share_created" }, ...current]); setShareMessage(`Salt-okunur teklif bağlantısı kopyalandı: ${url}`); }
    catch (caught) { setShareError(authErrorMessage(caught)); }
    finally { setShareBusy(false); }
  };
  return (
    <>
      <div className="detail-head">
        <div className="detail-title">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft />
          </button>
          <div>
            <div className="detail-id">
              <h1>{quote.id}</h1>
              <Status status={quote.status} />
            </div>
            <p>{customer.company} için oluşturuldu</p>
          </div>
        </div>
        <div className="detail-actions">
          {editable && <label className="quote-status-control">Durum<select aria-label="Teklif durumu" value={quote.status} disabled={statusBusy} onChange={async (event) => { const status = event.target.value as WorkspaceQuoteStatus; setStatusBusy(true); setShareError(""); try { await onStatusChange(quote.id, status); setActivities((current) => [{ id: crypto.randomUUID(), quoteId: quote.id, organizationId: "", actorId: "", type: "status_changed", status }, ...current]); } catch (caught) { setShareError(authErrorMessage(caught)); } finally { setStatusBusy(false); } }}><option>Taslak</option><option>Gönderildi</option><option>Onaylandı</option><option>Reddedildi</option></select></label>}
          {isFirebaseConfigured && editable && <button className="secondary" onClick={shareQuote} disabled={shareBusy}><Share2 /> {shareBusy ? "Hazırlanıyor..." : "Paylaşım bağlantısı"}</button>}
          <button
            className="secondary"
            onClick={downloadPdf}
            disabled={pdfLoading}
          >
            <FileText /> {pdfLoading ? "PDF hazırlanıyor..." : "PDF İndir"}
          </button>
        </div>
      </div>
      {shareMessage && <div className="auth-success quote-share-message">{shareMessage}</div>}
      {shareError && <div className="auth-error quote-share-message">{shareError}</div>}
      <div className="detail-grid">
        <article className="quote-paper">
          <div className="paper-brand">
            <div className="brand">
              <div className="brand-mark">
                <FileText />
              </div>
              <span>
                teklif<span>io</span>
              </span>
            </div>
            <div>
              <b>TEKLİF</b>
              <span>{quote.id}</span>
            </div>
          </div>
          <div className="paper-info">
            <div>
              <small>HAZIRLAYAN</small>
              <b>{settings.companyName}</b>
              <span>{settings.address}</span>
              <span>{settings.email}</span>
            </div>
            <div>
              <small>MÜŞTERİ</small>
              <b>{customer.company}</b>
              <span>{customer.name}</span>
              <span>{customer.email}</span>
            </div>
            <div>
              <small>TARİH</small>
              <b>{new Date(quote.date).toLocaleDateString("tr-TR")}</b>
              <span>
                Geçerlilik:{" "}
                {new Date(quote.validUntil).toLocaleDateString("tr-TR")}
              </span>
            </div>
          </div>
          <table className="paper-table">
            <thead>
              <tr>
                <th>ÜRÜN / HİZMET</th>
                <th>ADET</th>
                <th>BİRİM FİYAT</th>
                <th>İNDİRİM</th>
                <th>KDV</th>
                <th>TUTAR</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <b>{i.name}</b>
                  </td>
                  <td>{i.qty}</td>
                  <td>{currency(i.price, quote.currency)}</td>
                  <td>%{i.discount}</td>
                  <td>%{i.vat}</td>
                  <td>
                    <b>
                      {currency(
                        i.qty *
                          i.price *
                          (1 - i.discount / 100) *
                          (1 + i.vat / 100), quote.currency
                      )}
                    </b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="paper-bottom">
            <div>
              {quote.note && (
                <>
                  <small>NOT</small>
                  <p>{quote.note}</p>
                </>
              )}
            </div>
            <div className="paper-totals">
              <p>
                <span>Ara toplam</span>
                <b>{currency(totals.subtotal, quote.currency)}</b>
              </p>
              <p>
                <span>İndirim</span>
                <b>− {currency(totals.discount, quote.currency)}</b>
              </p>
              <p>
                <span>KDV</span>
                <b>{currency(totals.vat, quote.currency)}</b>
              </p>
              <p className="paper-grand">
                <span>Genel toplam</span>
                <b>{currency(totals.total, quote.currency)}</b>
              </p>
            </div>
          </div>
          <footer>
            Bu teklif {new Date(quote.validUntil).toLocaleDateString("tr-TR")}{" "}
            tarihine kadar geçerlidir.
          </footer>
        </article>
        <aside className="activity panel">
          <h3>Teklif hareketleri</h3>
          {activities.length > 0 && <div className="recorded-activities">{activities.slice(0, 6).map((activity) => <div key={activity.id}><i><Check /></i><span><b>{activity.type === "created" ? "Teklif kaydedildi" : activity.type === "pdf_downloaded" ? "PDF indirildi" : activity.type === "share_created" ? "Paylaşım bağlantısı oluşturuldu" : activity.type === "share_revoked" ? "Paylaşım bağlantısı iptal edildi" : `Durum değişti: ${activity.status}`}</b><small>{activity.createdAt ? activity.createdAt.toDate().toLocaleString("tr-TR") : "Şimdi"}</small></span></div>)}</div>}
          <div className="timeline">
            <div className="done">
              <i>
                <Check />
              </i>
              <span>
                <b>Teklif oluşturuldu</b>
                <small>
                  {new Date(quote.date).toLocaleDateString("tr-TR")}, 10:32
                </small>
              </span>
            </div>
            {quote.status !== "Taslak" && (
              <div className="done">
                <i>
                  <Check />
                </i>
                <span>
                  <b>Müşteriye gönderildi</b>
                  <small>
                    {new Date(quote.date).toLocaleDateString("tr-TR")}, 10:45
                  </small>
                </span>
              </div>
            )}
            <div>
              <i>
                <Clock3 />
              </i>
              <span>
                <b>Müşteri yanıtı bekleniyor</b>
                <small>Henüz yanıt yok</small>
              </span>
            </div>
          </div>
          <hr />
          {isFirebaseConfigured && <div className="quote-access-panel"><h4>Paylaşım ve sürümler</h4><p>{versions.length || 1} kayıtlı sürüm · {shares.filter((share) => share.active).length} aktif bağlantı</p>{editable && shares.filter((share) => share.active).map((share) => <button type="button" className="danger-link" key={share.token} onClick={async () => { await revokeQuoteShare(share.token); await logQuoteActivity(quote.id, "share_revoked").catch(() => undefined); setShares((current) => current.map((item) => item.token === share.token ? { ...item, active: false } : item)); setActivities((current) => [{ id: crypto.randomUUID(), quoteId: quote.id, organizationId: "", actorId: "", type: "share_revoked" }, ...current]); }}>Bağlantıyı iptal et · {share.expiresAt.toDate().toLocaleDateString("tr-TR")}</button>)}<small>Her kayıt işlemi değiştirilemez bir teklif sürümü oluşturur. Paylaşım bağlantıları 30 gün sonra kapanır.</small></div>}
          <hr />
          <div className="meta-row">
            <CalendarDays />
            <span>
              <small>Geçerlilik tarihi</small>
              <b>
                {new Date(quote.validUntil).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </b>
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

function SettingsPage({ settings, organizationName, onSave, currentUser, profile, canManage, onExport, onAccountNameChange }: { settings: WorkspaceSettings; organizationName: string; onSave: (settings: WorkspaceSettings) => Promise<void>; currentUser: User | null; profile: WorkspaceProfile | null; canManage: boolean; onExport: () => void; onAccountNameChange: (fullName: string) => Promise<void> }) {
  const [section, setSection] = useState<"company" | "quote" | "tax" | "team" | "account">(canManage ? "company" : "account");
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [accountName, setAccountName] = useState(profile?.fullName || currentUser?.displayName || "");
  const [accountBusy, setAccountBusy] = useState<"profile" | "verification" | "password" | null>(null);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<WorkspaceRole, "owner">>("member");
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamMessage, setTeamMessage] = useState("");
  const [teamError, setTeamError] = useState("");
  const [deletionConfirmation, setDeletionConfirmation] = useState("");
  const [deletionBusy, setDeletionBusy] = useState(false);
  const refreshTeam = async () => { const [nextMembers, nextInvitations] = await Promise.all([loadTeamMembers(), loadWorkspaceInvitations()]); setMembers(nextMembers); setInvitations(nextInvitations); };
  useEffect(() => { if (section === "team" && profile && canManageWorkspace(profile.role)) queueMicrotask(() => refreshTeam().catch((error: Error) => setTeamError(error.message))); }, [section, profile]);
  const inviteMember = async () => {
    setTeamBusy(true); setTeamError(""); setTeamMessage("");
    try { const invitation = await createWorkspaceInvitation({ email: inviteEmail, role: inviteRole, organizationName }); const link = `${window.location.origin}/?invite=${invitation.id}`; await navigator.clipboard.writeText(link); setInviteEmail(""); setTeamMessage(`Davet bağlantısı kopyalandı: ${link}`); await refreshTeam(); }
    catch (caught) { setTeamError(authErrorMessage(caught)); }
    finally { setTeamBusy(false); }
  };
  const changeMember = async (uid: string, values: { role?: Exclude<WorkspaceRole, "owner">; status?: "active" | "disabled" }) => { setTeamBusy(true); setTeamError(""); try { await updateWorkspaceMember(uid, values); await refreshTeam(); setTeamMessage("Ekip üyesi güncellendi."); } catch (caught) { setTeamError(authErrorMessage(caught)); } finally { setTeamBusy(false); } };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const vatRates = [...new Set(form.vatRates.map(Number))].filter((rate) => Number.isFinite(rate) && rate >= 0 && rate <= 100).sort((a, b) => a - b);
    if (!form.companyName.trim() || form.validityDays < 1 || !form.quotePrefix.trim() || !vatRates.length || !vatRates.includes(form.defaultVat)) return;
    await onSave({ ...form, vatRates }); setSaved(true); window.setTimeout(() => setSaved(false), 2500);
  };
  const set = (key: keyof WorkspaceSettings, value: WorkspaceSettings[keyof WorkspaceSettings]) => setForm({ ...form, [key]: value });
  const accountAction = async (action: "profile" | "verification" | "password") => {
    setAccountBusy(action); setAccountMessage(""); setAccountError("");
    try {
      if (action === "profile") { await onAccountNameChange(accountName); setAccountMessage("Hesap adı güncellendi."); }
      if (action === "verification") { await resendVerificationEmail(); setAccountMessage("Doğrulama e-postası yeniden gönderildi."); }
      if (action === "password" && currentUser?.email) { await requestPasswordReset(currentUser.email); setAccountMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."); }
    } catch (caught) { setAccountError(authErrorMessage(caught)); }
    finally { setAccountBusy(null); }
  };
  return (
    <>
      <PageHead title="Ayarlar" copy="Şirket ve teklif tercihlerini yönet." />
      <div className="settings-grid">
        <section className="panel settings-nav">
          {canManage && <button className={section === "company" ? "active" : ""} onClick={() => setSection("company")}>
            <Building2 /> Şirket bilgileri
          </button>}
          {canManage && <button className={section === "quote" ? "active" : ""} onClick={() => setSection("quote")}>
            <FileText /> Teklif ayarları
          </button>}
          {canManage && <button className={section === "tax" ? "active" : ""} onClick={() => setSection("tax")}>
            <Percent /> Vergi oranları
          </button>}
          {profile && canManageWorkspace(profile.role) && <button className={section === "team" ? "active" : ""} onClick={() => setSection("team")}>
            <Users /> Ekip yönetimi
          </button>}
          {currentUser && <button className={section === "account" ? "active" : ""} onClick={() => setSection("account")}>
            <UserRound /> Hesabım
          </button>}
        </section>
        <form className="panel settings-form" onSubmit={submit}>
          <div className="section-title">
            <span>
              {section === "company" ? <Building2 /> : section === "quote" ? <FileText /> : section === "tax" ? <Percent /> : section === "team" ? <Users /> : <ShieldCheck />}
            </span>
            <div>
              <h3>{section === "company" ? "Şirket bilgileri" : section === "quote" ? "Teklif ayarları" : section === "tax" ? "Vergi oranları" : section === "team" ? "Ekip yönetimi" : "Hesap güvenliği"}</h3>
              <p>{section === "company" ? "Teklif ve PDF belgelerinde görünecek bilgiler." : section === "quote" ? "Yeni tekliflerin varsayılan tercihleri." : section === "tax" ? "Katalog ve teklif kalemlerinde kullanılabilecek KDV oranları." : section === "team" ? "Süreli davet bağlantıları ve çalışma alanı yetkileri." : "Profilinizi, e-posta doğrulamasını ve şifrenizi yönetin."}</p>
            </div>
          </div>
          {section === "company" && <div className="form-grid">
            <label className="full">
              Şirket adı
              <input required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </label>
            <label>Telefon<input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label>
            <label>E-posta<input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></label>
            <label className="full">Web sitesi<input value={form.website} onChange={(e) => set("website", e.target.value)} /></label>
            <label>Vergi dairesi<input value={form.taxOffice} onChange={(e) => set("taxOffice", e.target.value)} /></label>
            <label>Vergi numarası<input value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} /></label>
            <label className="full">Adres<textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={3} /></label>
            <label>Marka rengi<input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} /></label>
            <label className="full">Şirket logosu<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 400_000) { window.alert("Logo 400 KB'dan küçük olmalıdır."); return; } const reader = new FileReader(); reader.onload = () => set("logoDataUrl", String(reader.result || "")); reader.readAsDataURL(file); }} /><small>PNG, JPG veya WebP; en fazla 400 KB. Logo yalnızca bu çalışma alanında saklanır.</small>{form.logoDataUrl && <button type="button" className="secondary" onClick={() => set("logoDataUrl", "")}>Logoyu kaldır</button>}</label>
          </div>}
          {section === "quote" && <div className="form-grid">
            <label>Geçerlilik süresi (gün)<input type="number" min="1" max="365" value={form.validityDays} onChange={(e) => set("validityDays", Number(e.target.value))} /></label>
            <label>Teklif ön eki<input required maxLength={12} value={form.quotePrefix} onChange={(e) => set("quotePrefix", e.target.value.toLocaleUpperCase("tr-TR").replace(/[^A-ZÇĞİÖŞÜ0-9-]/g, ""))} /></label>
            <label>Para birimi<select value={form.currency} onChange={(e) => set("currency", e.target.value)}><option value="TRY">TRY — Türk Lirası</option><option value="USD">USD — ABD Doları</option><option value="EUR">EUR — Euro</option></select></label>
            <label className="full">Varsayılan teklif notu<textarea rows={3} value={form.defaultNote} onChange={(e) => set("defaultNote", e.target.value)} /></label>
            <label className="full">PDF alt metni<textarea rows={3} value={form.footerText} onChange={(e) => set("footerText", e.target.value)} /></label>
          </div>}
          {section === "tax" && <div className="form-grid">
            <label className="full">KDV oranları (%)<input value={form.vatRates.join(", ")} onChange={(e) => set("vatRates", e.target.value.split(",").map((part) => Number(part.trim())).filter(Number.isFinite))} placeholder="0, 1, 10, 20" /><small>0–100 arasında, virgülle ayırın.</small></label>
            <label>Varsayılan KDV<select value={form.defaultVat} onChange={(e) => set("defaultVat", Number(e.target.value))}>{form.vatRates.map((rate) => <option key={rate} value={rate}>%{rate}</option>)}</select></label>
          </div>}
          {section === "team" && profile && <div className="team-settings">
            <div className="team-invite"><label>E-posta<input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="ekip@firma.com" /></label><label>Rol<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Exclude<WorkspaceRole, "owner">)}><option value="admin">Yönetici</option><option value="member">Üye</option><option value="viewer">Görüntüleyici</option></select></label><button type="button" className="primary" disabled={teamBusy || !inviteEmail.trim()} onClick={inviteMember}><UserPlus /> Davet bağlantısı oluştur</button></div>
            <small className="team-help">Bağlantı 7 gün geçerlidir ve yalnızca yazılan e-posta adresiyle kullanılabilir. Bağlantıyı güvenli bir kanaldan paylaşın.</small>
            {teamMessage && <div className="auth-success team-message">{teamMessage}</div>}{teamError && <div className="auth-error">{teamError}</div>}
            <div className="team-list"><h4>Ekip üyeleri</h4>{members.map((member) => <div className="team-row" key={member.uid}><div><b>{member.fullName || member.email}</b><small>{member.email}</small></div><span className={`member-status ${member.status}`}>{member.status === "active" ? "Aktif" : "Devre dışı"}</span>{member.role === "owner" ? <em>İşletme sahibi</em> : <select aria-label={`${member.email} rolü`} value={member.role} disabled={profile.role !== "owner" || teamBusy} onChange={(event) => changeMember(member.uid, { role: event.target.value as Exclude<WorkspaceRole, "owner"> })}><option value="admin">Yönetici</option><option value="member">Üye</option><option value="viewer">Görüntüleyici</option></select>}{profile.role === "owner" && member.role !== "owner" && <button type="button" className="secondary" disabled={teamBusy} onClick={() => changeMember(member.uid, { status: member.status === "active" ? "disabled" : "active" })}>{member.status === "active" ? "Devre dışı bırak" : "Etkinleştir"}</button>}</div>)}</div>
            {invitations.some((invite) => invite.status === "pending") && <div className="team-list"><h4>Bekleyen davetler</h4>{invitations.filter((invite) => invite.status === "pending").map((invite) => <div className="team-row" key={invite.id}><div><b>{invite.email}</b><small>{invite.role} · {invite.expiresAt.toDate().toLocaleDateString("tr-TR")} tarihine kadar</small></div><button type="button" className="secondary" disabled={teamBusy} onClick={async () => { await cancelWorkspaceInvitation(invite.id); await refreshTeam(); }}>İptal et</button></div>)}</div>}
          </div>}
          {section === "account" && currentUser && <div className="account-settings">
            <div className="account-status-card"><span className={currentUser.emailVerified ? "verified" : "pending"}>{currentUser.emailVerified ? <CheckCircle2 /> : <Mail />}</span><div><b>{currentUser.email}</b><small>{currentUser.emailVerified ? "E-posta doğrulandı" : "E-posta doğrulaması bekleniyor"}</small></div><em>{profile?.role === "owner" ? "İşletme sahibi" : profile?.role === "admin" ? "Yönetici" : profile?.role === "viewer" ? "Görüntüleyici" : "Üye"}</em></div>
            <label>Ad soyad<input value={accountName} onChange={(event) => setAccountName(event.target.value)} /></label>
            <div className="account-action-row"><div><b>Profil bilgileri</b><small>Hesap menüsünde görünen adınızı güncelleyin.</small></div><button type="button" className="secondary" onClick={() => accountAction("profile")} disabled={Boolean(accountBusy)}>{accountBusy === "profile" ? "Kaydediliyor..." : "Adı güncelle"}</button></div>
            {!currentUser.emailVerified && <div className="account-action-row"><div><b>E-posta doğrulama</b><small>Doğrulama bağlantısını yeniden gönderin.</small></div><button type="button" className="secondary" onClick={() => accountAction("verification")} disabled={Boolean(accountBusy)}>{accountBusy === "verification" ? "Gönderiliyor..." : "Tekrar gönder"}</button></div>}
            <div className="account-action-row"><div><b>Şifre güvenliği</b><small>Firebase üzerinden tek kullanımlık sıfırlama bağlantısı alın.</small></div><button type="button" className="secondary" onClick={() => accountAction("password")} disabled={Boolean(accountBusy)}>{accountBusy === "password" ? "Gönderiliyor..." : "Şifreyi sıfırla"}</button></div>
            <div className="account-action-row"><div><b>Verilerimi dışa aktar</b><small>Müşteri, ürün, teklif ve ayarlarınızı taşınabilir JSON dosyası olarak indirin.</small></div><button type="button" className="secondary" onClick={onExport}>JSON indir</button></div>
            {profile?.role === "owner" && <div className="deletion-request"><div><b>İşletme silme talebi</b><small>Bu işlem verileri hemen silmez. İnceleme için geri döndürülemez bir talep kaydı oluşturur.</small></div><label>Onaylamak için şirket adını yazın<input value={deletionConfirmation} onChange={(event) => setDeletionConfirmation(event.target.value)} placeholder={organizationName} /></label><button type="button" className="danger-button" disabled={deletionBusy || deletionConfirmation !== organizationName} onClick={async () => { setDeletionBusy(true); setAccountError(""); try { await requestOrganizationDeletion(deletionConfirmation); setAccountMessage("Silme talebiniz güvenli şekilde kaydedildi. Veriler henüz silinmedi."); setDeletionConfirmation(""); } catch (caught) { setAccountError(authErrorMessage(caught)); } finally { setDeletionBusy(false); } }}>{deletionBusy ? "Kaydediliyor..." : "Silme talebi oluştur"}</button></div>}
            {accountMessage && <div className="auth-success">{accountMessage}</div>}
            {accountError && <div className="auth-error">{accountError}</div>}
          </div>}
          {section !== "account" && section !== "team" && <div className="settings-save">
            {saved && <span className="save-confirmation">Kaydedildi</span>}
            <button className="primary" type="submit">
              <Check /> Ayarları kaydet
            </button>
          </div>}
        </form>
      </div>
    </>
  );
}

function CsvImportButton({ label, onRead }: { label: string; onRead: (text: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return <><input ref={input} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { onRead(await file.text()); } catch (error) { window.alert(error instanceof Error ? error.message : "CSV dosyası okunamadı."); } event.target.value = ""; }} /><button type="button" className="secondary" onClick={() => input.current?.click()}><Upload size={17} /> {label}</button></>;
}

function CsvImportPreview({ title, rows, onClose, onConfirm }: { title: string; rows: CsvPreviewRow[]; onClose: () => void; onConfirm: () => void }) {
  const valid = rows.filter((row) => !row.duplicate && !row.errors.length);
  return <Modal title={title} onClose={onClose}><div className="csv-preview"><p>Dosya henüz kaydedilmedi. Geçerli kayıtları kontrol edip açıkça onaylayın.</p><div className="csv-summary"><b>{valid.length} içe aktarılabilir</b><span>{rows.filter((row) => row.duplicate).length} mükerrer</span><span>{rows.filter((row) => row.errors.length).length} hatalı</span></div><div className="csv-table"><table><thead><tr><th>SATIR</th><th>KAYIT</th><th>DURUM</th></tr></thead><tbody>{rows.map((row) => <tr key={row.row}><td>{row.row}</td><td>{row.values.company || row.values.name}</td><td>{row.duplicate ? "Mükerrer — atlanacak" : row.errors.length ? row.errors.join(" ") : "Hazır"}</td></tr>)}</tbody></table></div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Vazgeç</button><button type="button" className="primary" disabled={!valid.length} onClick={onConfirm}><Check /> {valid.length} kaydı içe aktar</button></div></div></Modal>;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <button className="modal-scrim" onClick={onClose} aria-label="Kapat" />
      <div className="modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">YENİ KAYIT</span>
            <h2>{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Pencereyi kapat">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
