import { deterministicQuoteAi, type AiCustomer, type AiProduct } from "@/lib/ai-quote-parser";
import type { AiQuoteApiResponse } from "@/lib/ai-quote-contract";

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
};

type FirestoreDocument = {
  fields?: Record<string, FirestoreValue>;
};

const emptyResponse = (): AiQuoteApiResponse => ({
  customerMatch: null,
  items: [],
  quantity: 0,
  discount: 0,
  vat: 0,
  note: "",
});

const json = (body: AiQuoteApiResponse, status = 200, mode = "mock") =>
  Response.json(body, { status, headers: { "X-AI-Mode": mode } });

const field = (document: FirestoreDocument, name: string) => {
  const value = document.fields?.[name];
  if (!value) return undefined;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  return undefined;
};

async function getFirebaseContext(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) throw new Error("Firebase yapılandırılmadı.");

  const identityResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );
  const identity = (await identityResponse.json()) as { users?: Array<{ localId?: string }> };
  const uid = identity.users?.[0]?.localId;
  if (!identityResponse.ok || !uid) throw new Error("Geçersiz Firebase oturumu.");

  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
  const userResponse = await fetch(`${base}/users/${encodeURIComponent(uid)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Çalışma alanı bulunamadı.");
  const userDocument = (await userResponse.json()) as FirestoreDocument;
  const organizationId = field(userDocument, "organizationId");
  if (typeof organizationId !== "string" || !organizationId)
    throw new Error("Çalışma alanı bulunamadı.");
  return { base, projectId, uid, organizationId };
}
async function getOrganizationCatalog(
  idToken: string,
  projectId: string,
  organizationId: string,
  collectionId: "customers" | "products",
) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId }],
          where: {
            fieldFilter: {
              field: { fieldPath: "organizationId" },
              op: "EQUAL",
              value: { stringValue: organizationId },
            },
          },
        },
      }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Organization kataloğu okunamadı.");
  const rows = (await response.json()) as Array<{ document?: FirestoreDocument }>;
  return rows.flatMap((row) => (row.document ? [row.document] : []));
}

function deterministicResponse(
  prompt: string,
  customers: AiCustomer[],
  products: AiProduct[],
): AiQuoteApiResponse {
  const draft = deterministicQuoteAi.parse(prompt, customers, products);
  const discount = draft.items[0]?.discount ?? 0;
  const vat = draft.items[0]?.vat ?? 0;
  return {
    customerMatch: draft.customer,
    items: draft.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.qty,
      discount: item.discount,
      vat: item.vat,
    })),
    quantity: draft.items.reduce((sum, item) => sum + item.qty, 0),
    discount,
    vat,
    note: draft.note,
  };
}

async function analyzeWithOpenAi(
  prompt: string,
  customers: AiCustomer[],
  products: AiProduct[],
  apiKey: string,
): Promise<AiQuoteApiResponse> {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      customerId: { type: ["number", "null"] },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            productId: { type: "number" },
            quantity: { type: "number" },
            discount: { type: "number" },
            vat: { type: "number" },
          },
          required: ["productId", "quantity", "discount", "vat"],
        },
      },
      note: { type: "string" },
    },
    required: ["customerId", "items", "note"],
  };
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      instructions:
        "Türkçe müşteri talebini eşleştir. Yalnızca verilen müşteri ve ürün ID'lerini kullan. Eşleşme yoksa customerId null veya items boş dön. Yeni kayıt uydurma. İndirimi ve KDV'yi 0-100 arasında, miktarı en az 1 olarak dön.",
      input: JSON.stringify({ prompt, customers, products }),
      text: {
        format: {
          type: "json_schema",
          name: "quote_catalog_match",
          strict: true,
          schema,
        },
      },
    }),
  });
  if (!response.ok) throw new Error("LLM servisi yanıt vermedi.");
  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  const outputText =
    payload.output_text ??
    payload.output
      ?.flatMap((entry) => entry.content ?? [])
      .find((entry) => entry.type === "output_text")?.text;
  if (!outputText) throw new Error("LLM çıktısı boş.");
  const parsed = JSON.parse(outputText) as {
    customerId: number | null;
    items: Array<{ productId: number; quantity: number; discount: number; vat: number }>;
    note: string;
  };

  const customer = customers.find((entry) => entry.id === parsed.customerId) ?? null;
  const items = parsed.items.flatMap((entry) => {
    const product = products.find((candidate) => candidate.id === entry.productId);
    if (!product) return [];
    return [{
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: Math.max(1, Math.round(Number(entry.quantity) || 1)),
      discount: Math.min(100, Math.max(0, Number(entry.discount) || 0)),
      vat: Math.min(100, Math.max(0, Number(entry.vat) || product.vat)),
    }];
  });
  return {
    customerMatch: customer,
    items,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    discount: items[0]?.discount ?? 0,
    vat: items[0]?.vat ?? 0,
    note: typeof parsed.note === "string" ? parsed.note.slice(0, 1000) : "",
  };
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = request.headers.get("x-vercel-id") ?? undefined;
  const respond = (body: AiQuoteApiResponse, status = 200, mode = "mock", reason?: string) => {
    const entry = JSON.stringify({
      level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
      message: "ai_quote_request",
      route: "/api/ai-quote",
      requestId,
      status,
      mode,
      reason,
      durationMs: Date.now() - startedAt,
    });
    if (status >= 500) console.error(entry);
    else if (status >= 400) console.warn(entry);
    else console.log(entry);
    return json(body, status, mode);
  };
  const authorization = request.headers.get("authorization");
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!idToken) return respond(emptyResponse(), 401, "none", "missing_auth");

  let prompt = "";
  try {
    const body = (await request.json()) as { prompt?: unknown };
    prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 4000) : "";
  } catch {
    return respond(emptyResponse(), 400, "none", "invalid_json");
  }
  if (!prompt) return respond(emptyResponse(), 400, "none", "empty_prompt");

  try {
    const context = await getFirebaseContext(idToken);
    const [customerDocs, productDocs] = await Promise.all([
      getOrganizationCatalog(idToken, context.projectId, context.organizationId, "customers"),
      getOrganizationCatalog(idToken, context.projectId, context.organizationId, "products"),
    ]);
    const customers: AiCustomer[] = customerDocs.flatMap((document) => {
      const id = field(document, "id");
      const name = field(document, "name");
      const company = field(document, "company");
      return typeof id === "number" && typeof name === "string" && typeof company === "string"
        ? [{ id, name, company }]
        : [];
    });
    const products: AiProduct[] = productDocs.flatMap((document) => {
      const id = field(document, "id");
      const name = field(document, "name");
      const price = field(document, "price");
      const vat = field(document, "vat");
      return typeof id === "number" && typeof name === "string" && typeof price === "number" && typeof vat === "number"
        ? [{ id, name, price, vat }]
        : [];
    });

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return respond(deterministicResponse(prompt, customers, products));
    try {
      return respond(await analyzeWithOpenAi(prompt, customers, products, apiKey), 200, "openai");
    } catch (error) {
      return respond(
        deterministicResponse(prompt, customers, products),
        200,
        "mock-fallback",
        error instanceof Error ? error.name : "UnknownError",
      );
    }
  } catch {
    return respond(emptyResponse(), 401, "none", "invalid_workspace");
  }
}
