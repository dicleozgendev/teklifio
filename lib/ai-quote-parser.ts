export type AiCustomer = {
  id: number;
  name: string;
  company: string;
};

export type AiProduct = {
  id: number;
  name: string;
  price: number;
  vat: number;
};

export type AiQuoteItem = {
  productId: number;
  name: string;
  qty: number;
  price: number;
  discount: number;
  vat: number;
};

export type AiQuoteDraft = {
  customer: AiCustomer | null;
  items: AiQuoteItem[];
  note: string;
  errors: string[];
};

export interface QuoteAiService {
  parse(
    prompt: string,
    customers: AiCustomer[],
    products: AiProduct[],
  ): AiQuoteDraft;
}

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9çğıöşü%\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const companyCore = (company: string) =>
  normalize(company)
    .replace(
      /\s+(?:a\.?\s?s\.?|ltd\.?|sti\.?|limited|anonim|sirketi)\.?$/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

const quantityBefore = (text: string, productIndex: number) => {
  const before = text.slice(Math.max(0, productIndex - 55), productIndex);
  const match = before.match(/(\d+)\s*(?:adet|aylık|aylik|ay|paket|proje)?\s*$/);
  return match ? Math.max(1, Number(match[1])) : 1;
};

const extractRate = (text: string, type: "discount" | "vat") => {
  const patterns =
    type === "vat"
      ? [
          /kdv(?:\s+oranı)?\s*(?:%|yüzde)?\s*(\d{1,2})/,
          /(?:%|yüzde\s*)(\d{1,2})\s*kdv/,
        ]
      : [
          /(?:%|yüzde\s*)(\d{1,2})\s*indirim(?:li)?/,
          /indirim(?:\s+oranı)?\s*(?:%|yüzde)?\s*(\d{1,2})/,
        ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Math.min(100, Math.max(0, Number(match[1])));
  }
  return type === "vat" ? null : 0;
};

const extractNote = (prompt: string) => {
  const match = prompt.match(/(?:not|açıklama)\s*:\s*(.+)$/i);
  return match?.[1]?.trim() ?? "";
};

export const deterministicQuoteAi: QuoteAiService = {
  parse(prompt, customers, products) {
    const text = normalize(prompt);
    const errors: string[] = [];

    const customer =
      customers.find((candidate) => {
        const company = normalize(candidate.company);
        const core = companyCore(candidate.company);
        const contact = normalize(candidate.name);
        return text.includes(company) || text.includes(core) || text.includes(contact);
      }) ?? null;

    if (!customer) {
      errors.push("Müşteri listesinde eşleşen bir kayıt bulunamadı.");
    }

    const discount = extractRate(text, "discount") ?? 0;
    const requestedVat = extractRate(text, "vat");
    const items = products.flatMap((product) => {
      const productName = normalize(product.name);
      const index = text.indexOf(productName);
      if (index < 0) return [];

      return [
        {
          productId: product.id,
          name: product.name,
          qty: quantityBefore(text, index),
          price: product.price,
          discount,
          vat: requestedVat ?? product.vat,
        },
      ];
    });

    if (!items.length) {
      errors.push("Ürün veya hizmet kataloğunda eşleşen bir kayıt bulunamadı.");
    }

    return { customer, items, note: extractNote(prompt), errors };
  },
};
