export type CsvImportKind = "customers" | "products";

export type CsvPreviewRow = {
  row: number;
  values: Record<string, string>;
  errors: string[];
  duplicate: boolean;
};

const splitCsvLine = (line: string) => {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { cells.push(value.trim()); value = ""; }
    else value += char;
  }
  cells.push(value.trim());
  return cells;
};

const normalizeHeader = (value: string) => value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, "_");

export function parseCsv(text: string) {
  if (text.length > 250_000) throw new Error("CSV dosyası 250 KB sınırını aşıyor.");
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV dosyasında başlık ve en az bir veri satırı bulunmalıdır.");
  if (lines.length > 251) throw new Error("Tek seferde en fazla 250 kayıt içe aktarılabilir.");
  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  if (new Set(headers).size !== headers.length) throw new Error("CSV başlıkları benzersiz olmalıdır.");
  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    return { row: index + 2, values: Object.fromEntries(headers.map((header, cellIndex) => [header, (cells[cellIndex] ?? "").slice(0, 500)])) };
  });
}

const validEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function previewCustomerCsv(text: string, existing: Array<{ company: string; email: string }>): CsvPreviewRow[] {
  const seen = new Set(existing.map((item) => `${item.company}|${item.email}`.toLocaleLowerCase("tr-TR")));
  return parseCsv(text).map(({ row, values }) => {
    const company = values.company || values.sirket || values["şirket"] || "";
    const email = values.email || values["e-posta"] || values.eposta || "";
    const key = `${company}|${email}`.toLocaleLowerCase("tr-TR");
    const errors = [...(!company.trim() ? ["Şirket adı zorunludur."] : []), ...(!validEmail(email) ? ["E-posta biçimi geçersizdir."] : [])];
    const duplicate = seen.has(key);
    if (!duplicate && !errors.length) seen.add(key);
    return { row, values: { company, name: values.name || values.yetkili || "", email, phone: values.phone || values.telefon || "", address: values.address || values.adres || "", taxOffice: values.taxoffice || values.vergi_dairesi || "", taxNumber: values.taxnumber || values.vergi_numarasi || "", notes: values.notes || values.notlar || "" }, errors, duplicate };
  });
}

export function previewProductCsv(text: string, existing: Array<{ name: string; code: string }>): CsvPreviewRow[] {
  const seen = new Set(existing.map((item) => `${item.name}|${item.code}`.toLocaleLowerCase("tr-TR")));
  return parseCsv(text).map(({ row, values }) => {
    const name = values.name || values.ad || "";
    const code = values.code || values.kod || "";
    const price = Number((values.price || values.fiyat || "0").replace(",", "."));
    const vat = Number((values.vat || values.kdv || "20").replace("%", ""));
    const type = (values.type || values.tur || values["tür"] || "Hizmet").toLocaleLowerCase("tr-TR") === "ürün" ? "Ürün" : "Hizmet";
    const key = `${name}|${code}`.toLocaleLowerCase("tr-TR");
    const errors = [...(!name.trim() ? ["Ad zorunludur."] : []), ...(!code.trim() ? ["Kod zorunludur."] : []), ...(!Number.isFinite(price) || price < 0 ? ["Fiyat geçersizdir."] : []), ...(!Number.isFinite(vat) || vat < 0 || vat > 100 ? ["KDV 0–100 arasında olmalıdır."] : [])];
    const duplicate = seen.has(key);
    if (!duplicate && !errors.length) seen.add(key);
    return { row, values: { name, code, type, price: String(price), vat: String(vat), unit: values.unit || values.birim || "Adet", description: values.description || values.aciklama || values["açıklama"] || "" }, errors, duplicate };
  });
}
