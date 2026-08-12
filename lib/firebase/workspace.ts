import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseServices } from "./client";
import { normalizeWorkspaceRole, type WorkspaceRole } from "../auth-utils";

export type WorkspaceCustomer = { id: number; name: string; company: string; email: string; phone: string; address?: string; taxOffice?: string; taxNumber?: string; notes?: string; initials: string; color: string };
export type WorkspaceProduct = { id: number; name: string; code: string; type: "Ürün" | "Hizmet"; price: number; vat: number; unit: string; description?: string };
export type WorkspaceQuoteItem = { id: number; productId: number; name: string; qty: number; price: number; discount: number; vat: number };
export type WorkspaceQuoteStatus = "Taslak" | "Gönderildi" | "Onaylandı" | "Reddedildi";
export type WorkspaceQuote = { id: string; customerId: number; date: string; validUntil: string; status: WorkspaceQuoteStatus; items: WorkspaceQuoteItem[]; note: string; currency?: string };
export type WorkspaceSettings = { companyName: string; address: string; phone: string; email: string; website: string; taxOffice: string; taxNumber: string; validityDays: number; quotePrefix: string; currency: string; defaultNote: string; footerText: string; vatRates: number[]; defaultVat: number };
export type WorkspaceProfile = { uid: string; organizationId: string; fullName: string; email: string; role: WorkspaceRole; status: "active" | "disabled"; emailVerificationRequired: boolean };
export type WorkspaceMember = { uid: string; organizationId: string; fullName: string; email: string; role: WorkspaceRole; status: "active" | "disabled" };
export type WorkspaceInvitation = { id: string; organizationId: string; organizationName: string; email: string; role: Exclude<WorkspaceRole, "owner">; status: "pending" | "accepted" | "cancelled"; expiresAt: Timestamp };
export type QuoteVersion = { id: string; quoteId: string; organizationId: string; createdBy: string; createdAt?: Timestamp; snapshot: WorkspaceQuote };
export type SharedQuoteSnapshot = { id: string; date: string; validUntil: string; items: Array<Pick<WorkspaceQuoteItem, "name" | "qty" | "price" | "discount" | "vat">>; note: string; currency?: string };
export type SharedCustomerSnapshot = Pick<WorkspaceCustomer, "company" | "name">;
export type SharedCompanySnapshot = Pick<WorkspaceSettings, "companyName" | "address" | "email">;
export type QuoteShare = { token: string; quoteId: string; organizationId: string; active: boolean; expiresAt: Timestamp; quote: SharedQuoteSnapshot; customer: SharedCustomerSnapshot; settings: SharedCompanySnapshot };
export type QuoteActivity = { id: string; quoteId: string; organizationId: string; actorId: string; type: "created" | "pdf_downloaded" | "share_created" | "share_revoked" | "status_changed"; status?: WorkspaceQuoteStatus; createdAt?: Timestamp };

async function getOrganizationId() {
  const services = getFirebaseServices();
  const user = services?.auth.currentUser;
  if (!services || !user) throw new Error("Firebase oturumu bulunamadı.");
  const userRef = doc(services.db, "users", user.uid);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      if (snapshot.data().status === "disabled") throw new Error("Hesabınız bu çalışma alanında devre dışı bırakılmış.");
      return snapshot.data().organizationId as string;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  throw new Error("Kullanıcı çalışma alanı bulunamadı.");
}

export async function loadWorkspaceData() {
  const services = getFirebaseServices();
  if (!services) throw new Error("Firebase yapılandırılmadı.");
  const organizationId = await getOrganizationId();
  const user = services.auth.currentUser;
  if (!user) throw new Error("Firebase oturumu bulunamadı.");
  const own = (name: string) =>
    getDocs(query(collection(services.db, name), where("organizationId", "==", organizationId)));
  const [customerDocs, productDocs, quoteDocs, itemDocs] = await Promise.all([
    own("customers"), own("products"), own("quotes"), own("quoteItems"),
  ]);

  const customers = customerDocs.docs.map((entry) => entry.data() as WorkspaceCustomer);
  const products = productDocs.docs.map((entry) => entry.data() as WorkspaceProduct);
  const allItems = itemDocs.docs.map((entry) => entry.data() as WorkspaceQuoteItem & { quoteId: string });
  const quotes = quoteDocs.docs.map((entry) => {
    const data = entry.data() as Omit<WorkspaceQuote, "items">;
    return { ...data, items: allItems.filter((item) => item.quoteId === data.id) };
  });
  quotes.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const [organization, profileDocument] = await Promise.all([
    getDoc(doc(services.db, "organizations", organizationId)),
    getDoc(doc(services.db, "users", user.uid)),
  ]);
  const profileData = profileDocument.data();
  const profile: WorkspaceProfile = {
    uid: user.uid,
    organizationId,
    fullName: String(profileData?.fullName ?? user.displayName ?? ""),
    email: String(profileData?.email ?? user.email ?? ""),
    role: normalizeWorkspaceRole(profileData?.role),
    status: profileData?.status === "disabled" ? "disabled" : "active",
    emailVerificationRequired: profileData?.emailVerificationRequired === true,
  };
  const organizationData = organization.data();
  return {
    customers,
    products,
    quotes,
    settings: organizationData?.settings as WorkspaceSettings | undefined,
    organizationName: String(organizationData?.name ?? "Çalışma alanı"),
    onboardingCompleted: typeof organizationData?.onboardingCompleted === "boolean"
      ? organizationData.onboardingCompleted
      : true,
    profile,
  };
}

export async function loadTeamMembers() {
  const services = getFirebaseServices();
  if (!services) throw new Error("Firebase yapılandırılmadı.");
  const organizationId = await getOrganizationId();
  const snapshot = await getDocs(query(collection(services.db, "users"), where("organizationId", "==", organizationId)));
  return snapshot.docs.map((entry) => { const data = entry.data(); return { uid: entry.id, organizationId, fullName: String(data.fullName ?? ""), email: String(data.email ?? ""), role: normalizeWorkspaceRole(data.role), status: data.status === "disabled" ? "disabled" as const : "active" as const }; });
}

export async function loadWorkspaceInvitations() {
  const services = getFirebaseServices();
  if (!services) throw new Error("Firebase yapılandırılmadı.");
  const organizationId = await getOrganizationId();
  const snapshot = await getDocs(query(collection(services.db, "invitations"), where("organizationId", "==", organizationId)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as WorkspaceInvitation));
}

export async function createWorkspaceInvitation(input: { email: string; role: Exclude<WorkspaceRole, "owner">; organizationName: string }) {
  const services = getFirebaseServices(); const user = services?.auth.currentUser;
  if (!services || !user) throw new Error("Firebase oturumu bulunamadı.");
  const organizationId = await getOrganizationId(); const id = crypto.randomUUID();
  const invitation: WorkspaceInvitation = { id, organizationId, organizationName: input.organizationName, email: input.email.trim().toLocaleLowerCase("tr-TR"), role: input.role, status: "pending", expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000) };
  await setDoc(doc(services.db, "invitations", id), { ...invitation, createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return invitation;
}

export async function updateWorkspaceMember(uid: string, values: { role?: Exclude<WorkspaceRole, "owner">; status?: "active" | "disabled" }) {
  const services = getFirebaseServices(); if (!services) throw new Error("Firebase yapılandırılmadı.");
  await getOrganizationId(); await updateDoc(doc(services.db, "users", uid), { ...values, updatedAt: serverTimestamp() });
}

export async function cancelWorkspaceInvitation(id: string) {
  const services = getFirebaseServices(); if (!services) throw new Error("Firebase yapılandırılmadı.");
  await getOrganizationId(); await updateDoc(doc(services.db, "invitations", id), { status: "cancelled", updatedAt: serverTimestamp() });
}

export async function requestOrganizationDeletion(confirmation: string) {
  const services = getFirebaseServices(); const user = services?.auth.currentUser;
  if (!services || !user) throw new Error("Firebase oturumu bulunamadı.");
  const organizationId = await getOrganizationId();
  await setDoc(doc(services.db, "deletionRequests", organizationId), {
    organizationId, requestedBy: user.uid, confirmation,
    status: "pending", requestedAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}

export async function completeWorkspaceOnboarding() {
  const services = getFirebaseServices();
  if (!services) throw new Error("Firebase yapılandırılmadı.");
  const organizationId = await getOrganizationId();
  await setDoc(doc(services.db, "organizations", organizationId), {
    onboardingCompleted: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveCustomer(customer: WorkspaceCustomer) {
  const services = getFirebaseServices();
  if (!services) return;
  const organizationId = await getOrganizationId();
  await setDoc(doc(services.db, "customers", `${organizationId}_${customer.id}`), {
    ...customer, organizationId, updatedAt: serverTimestamp(),
  });
}

export async function saveProduct(product: WorkspaceProduct) {
  const services = getFirebaseServices();
  if (!services) return;
  const organizationId = await getOrganizationId();
  await setDoc(doc(services.db, "products", `${organizationId}_${product.id}`), {
    ...product, organizationId, updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(customerId: number) {
  const services = getFirebaseServices();
  if (!services) return;
  const organizationId = await getOrganizationId();
  await deleteDoc(doc(services.db, "customers", `${organizationId}_${customerId}`));
}

export async function deleteProduct(productId: number) {
  const services = getFirebaseServices();
  if (!services) return;
  const organizationId = await getOrganizationId();
  await deleteDoc(doc(services.db, "products", `${organizationId}_${productId}`));
}

export async function saveWorkspaceSettings(settings: WorkspaceSettings) {
  const services = getFirebaseServices();
  if (!services) return;
  const organizationId = await getOrganizationId();
  await setDoc(doc(services.db, "organizations", organizationId), { settings, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveQuote(quote: WorkspaceQuote) {
  const services = getFirebaseServices();
  if (!services) return;
  const organizationId = await getOrganizationId();
  const batch = writeBatch(services.db);
  const quoteDocumentId = `${organizationId}_${quote.id}`;
  const versionId = `${organizationId}_${quote.id}_${crypto.randomUUID()}`;
  batch.set(doc(services.db, "quotes", quoteDocumentId), {
    id: quote.id,
    organizationId,
    customerId: quote.customerId,
    date: quote.date,
    validUntil: quote.validUntil,
    status: quote.status,
    note: quote.note,
    currency: quote.currency || "TRY",
    updatedAt: serverTimestamp(),
  });
  quote.items.forEach((item, index) => {
    batch.set(doc(services.db, "quoteItems", `${organizationId}_${quote.id}_${index + 1}`), {
      ...item,
      id: index + 1,
      quoteId: quote.id,
      organizationId,
      updatedAt: serverTimestamp(),
    });
  });
  batch.set(doc(services.db, "quoteVersions", versionId), {
    id: versionId, quoteId: quote.id, organizationId,
    createdBy: services.auth.currentUser?.uid ?? "", createdAt: serverTimestamp(), snapshot: quote,
  });
  const activityId = `${organizationId}_${quote.id}_${crypto.randomUUID()}`;
  batch.set(doc(services.db, "quoteActivities", activityId), { id: activityId, quoteId: quote.id, organizationId, actorId: services.auth.currentUser?.uid ?? "", type: "created", createdAt: serverTimestamp() });
  try {
    await batch.commit();
  } catch (error) {
    await deleteDoc(doc(services.db, "quotes", quoteDocumentId)).catch(() => undefined);
    throw error;
  }
}

export async function logQuoteActivity(quoteId: string, type: Exclude<QuoteActivity["type"], "created">) {
  const services = getFirebaseServices(); const user = services?.auth.currentUser;
  if (!services || !user) return;
  const organizationId = await getOrganizationId(); const id = `${organizationId}_${quoteId}_${crypto.randomUUID()}`;
  await setDoc(doc(services.db, "quoteActivities", id), { id, quoteId, organizationId, actorId: user.uid, type, createdAt: serverTimestamp() });
}

export async function loadQuoteActivities(quoteId: string) {
  const services = getFirebaseServices(); if (!services) throw new Error("Firebase yapılandırılmadı.");
  const organizationId = await getOrganizationId();
  const snapshot = await getDocs(query(collection(services.db, "quoteActivities"), where("organizationId", "==", organizationId), where("quoteId", "==", quoteId)));
  return snapshot.docs.map((entry) => entry.data() as QuoteActivity).sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}

export async function updateQuoteStatus(quoteId: string, status: WorkspaceQuoteStatus) {
  const services = getFirebaseServices(); const user = services?.auth.currentUser;
  if (!services || !user) throw new Error("Firebase oturumu bulunamadı.");
  const organizationId = await getOrganizationId(); const activityId = `${organizationId}_${quoteId}_${crypto.randomUUID()}`;
  const batch = writeBatch(services.db);
  batch.update(doc(services.db, "quotes", `${organizationId}_${quoteId}`), { status, updatedAt: serverTimestamp() });
  batch.set(doc(services.db, "quoteActivities", activityId), { id: activityId, quoteId, organizationId, actorId: user.uid, type: "status_changed", status, createdAt: serverTimestamp() });
  await batch.commit();
}

export async function loadQuoteVersions(quoteId: string) {
  const services = getFirebaseServices(); if (!services) throw new Error("Firebase yapılandırılmadı.");
  const organizationId = await getOrganizationId();
  const snapshot = await getDocs(query(collection(services.db, "quoteVersions"), where("organizationId", "==", organizationId), where("quoteId", "==", quoteId)));
  return snapshot.docs.map((entry) => entry.data() as QuoteVersion).sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}

export async function createQuoteShare(input: { quote: WorkspaceQuote; customer: WorkspaceCustomer; settings: WorkspaceSettings }) {
  const services = getFirebaseServices(); const user = services?.auth.currentUser;
  if (!services || !user) throw new Error("Firebase oturumu bulunamadı.");
  const organizationId = await getOrganizationId(); const token = crypto.randomUUID();
  const share: QuoteShare = {
    token,
    quoteId: input.quote.id,
    organizationId,
    active: true,
    expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
    quote: {
      id: input.quote.id,
      date: input.quote.date,
      validUntil: input.quote.validUntil,
      items: input.quote.items.map(({ name, qty, price, discount, vat }) => ({ name, qty, price, discount, vat })),
      note: input.quote.note,
      currency: input.quote.currency,
    },
    customer: { company: input.customer.company, name: input.customer.name },
    settings: { companyName: input.settings.companyName, address: input.settings.address, email: input.settings.email },
  };
  await setDoc(doc(services.db, "quoteShares", token), { ...share, createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return share;
}

export async function loadQuoteShares(quoteId: string) {
  const services = getFirebaseServices(); if (!services) throw new Error("Firebase yapılandırılmadı.");
  const organizationId = await getOrganizationId();
  const snapshot = await getDocs(query(collection(services.db, "quoteShares"), where("organizationId", "==", organizationId), where("quoteId", "==", quoteId)));
  return snapshot.docs.map((entry) => entry.data() as QuoteShare);
}

export async function revokeQuoteShare(token: string) {
  const services = getFirebaseServices(); if (!services) throw new Error("Firebase yapılandırılmadı.");
  await getOrganizationId(); await updateDoc(doc(services.db, "quoteShares", token), { active: false, updatedAt: serverTimestamp() });
}
