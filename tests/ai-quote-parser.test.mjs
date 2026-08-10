import assert from "node:assert/strict";
import test from "node:test";
import { deterministicQuoteAi } from "../lib/ai-quote-parser.ts";

const customers = [
  { id: 1, name: "Ayşe Yılmaz", company: "Nova Teknoloji" },
  { id: 2, name: "Mehmet Kaya", company: "Kaya Ltd." },
];
const products = [
  { id: 10, name: "Kurumsal Web Sitesi", price: 50000, vat: 20 },
  { id: 20, name: "SEO Danışmanlığı", price: 12000, vat: 10 },
];

test("local AI parser matches only catalog records and applies quantities, discount, and VAT", () => {
  const result = deterministicQuoteAi.parse(
    "Nova Teknoloji için 2 adet Kurumsal Web Sitesi, 3 aylık SEO Danışmanlığı ve %10 indirimli teklif hazırla. KDV %20.",
    customers,
    products,
  );
  assert.equal(result.customer?.id, 1);
  assert.deepEqual(result.items.map(({ productId, qty, discount, vat }) => ({ productId, qty, discount, vat })), [
    { productId: 10, qty: 2, discount: 10, vat: 20 },
    { productId: 20, qty: 3, discount: 10, vat: 20 },
  ]);
  assert.deepEqual(result.errors, []);
});

test("local AI parser never invents missing customers or products", () => {
  const result = deterministicQuoteAi.parse("Olmayan Firma için 4 adet Hayali Ürün hazırla.", customers, products);
  assert.equal(result.customer, null);
  assert.deepEqual(result.items, []);
  assert.equal(result.errors.length, 2);
});

test("local AI parser extracts an explicit note without saving anything", () => {
  const result = deterministicQuoteAi.parse("Nova Teknoloji için 1 Kurumsal Web Sitesi. Not: Teslim süresi 4 haftadır.", customers, products);
  assert.equal(result.note, "Teslim süresi 4 haftadır.");
  assert.equal(result.items.length, 1);
});
