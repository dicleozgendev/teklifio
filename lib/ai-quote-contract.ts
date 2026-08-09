import type { AiCustomer, AiProduct, AiQuoteDraft } from "./ai-quote-parser";

export type AiQuoteApiItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  vat: number;
};

export type AiQuoteApiResponse = {
  customerMatch: AiCustomer | null;
  items: AiQuoteApiItem[];
  quantity: number;
  discount: number;
  vat: number;
  note: string;
};

export function apiResponseToDraft(
  response: AiQuoteApiResponse,
  customers: AiCustomer[],
  products: AiProduct[],
): AiQuoteDraft {
  const customer = response.customerMatch
    ? customers.find((entry) => entry.id === response.customerMatch?.id) ?? null
    : null;
  const items = response.items.flatMap((entry) => {
    const product = products.find((candidate) => candidate.id === entry.productId);
    if (!product) return [];
    return [{
      productId: product.id,
      name: product.name,
      qty: Math.max(1, entry.quantity),
      price: product.price,
      discount: Math.min(100, Math.max(0, entry.discount)),
      vat: Math.min(100, Math.max(0, entry.vat)),
    }];
  });
  const errors: string[] = [];
  if (!customer) errors.push("Müşteri listesinde eşleşen bir kayıt bulunamadı.");
  if (!items.length)
    errors.push("Ürün veya hizmet kataloğunda eşleşen bir kayıt bulunamadı.");
  return { customer, items, note: response.note, errors };
}
