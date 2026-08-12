import assert from "node:assert/strict";
import test from "node:test";
import { previewCustomerCsv, previewProductCsv } from "../lib/csv-import.ts";

test("customer import validates, previews and detects duplicates", () => {
  const rows = previewCustomerCsv("company,name,email\nNova Teknoloji,Ayşe,ayse@nova.test\nNova Teknoloji,Ayşe,ayse@nova.test\nEksik,,bad", []);
  assert.equal(rows[0].errors.length, 0);
  assert.equal(rows[1].duplicate, true);
  assert.match(rows[2].errors.join(" "), /E-posta/);
});

test("product import rejects invalid money and VAT", () => {
  const rows = previewProductCsv("name,code,type,price,vat\nSEO,SEO-1,Hizmet,5000,20\nBozuk,X,Ürün,-1,120", []);
  assert.equal(rows[0].errors.length, 0);
  assert.equal(rows[0].values.type, "Hizmet");
  assert.equal(rows[1].errors.length, 2);
});

test("CSV organization identifiers are ignored", () => {
  const [row] = previewCustomerCsv("company,email,organizationId\nAcme,a@acme.test,other-org", []);
  assert.equal("organizationId" in row.values, false);
});

test("CSV import enforces bounded batch and payload sizes", () => {
  const tooMany = `company,email\n${Array.from({ length: 251 }, (_, index) => `C${index},c${index}@test.example`).join("\n")}`;
  assert.throws(() => previewCustomerCsv(tooMany, []), /250/);
  assert.throws(() => previewCustomerCsv(`company,email\n${"x".repeat(250_001)}`, []), /250 KB/);
});
