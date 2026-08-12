import type { TableCell, TDocumentDefinitions } from "pdfmake/interfaces";

export type PdfQuoteItem = {
  name: string;
  qty: number;
  price: number;
  discount: number;
  vat: number;
};

export type PdfQuote = {
  id: string;
  date: string;
  validUntil: string;
  note: string;
  items: PdfQuoteItem[];
  currency?: string;
};

export type PdfCustomer = {
  company: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  taxOffice?: string;
  taxNumber?: string;
};
export type PdfCompany = { companyName: string; address: string; phone: string; email: string; website: string; taxOffice: string; taxNumber: string; footerText: string; currency: string; logoDataUrl?: string; primaryColor?: string };

const money = (value: number, currency = "TRY") =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);

const dateText = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const lineTotal = (item: PdfQuoteItem) =>
  item.qty *
  item.price *
  (1 - item.discount / 100) *
  (1 + item.vat / 100);

export async function downloadQuotePdf(
  quote: PdfQuote,
  customer: PdfCustomer,
  company: PdfCompany,
) {
  const brandColor = /^#[0-9a-f]{6}$/i.test(company.primaryColor || "") ? company.primaryColor! : "#6756E8";
  const quoteMoney = (value: number) => money(value, quote.currency || company.currency);
  const previewWindow = window.open("", "_blank");
  const [{ default: pdfMake }, { default: fontVfs }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);

  pdfMake.addVirtualFileSystem(fontVfs);

  const subtotal = quote.items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0,
  );
  const discount = quote.items.reduce(
    (sum, item) =>
      sum + item.qty * item.price * (item.discount / 100),
    0,
  );
  const vat = quote.items.reduce(
    (sum, item) =>
      sum +
      item.qty *
        item.price *
        (1 - item.discount / 100) *
        (item.vat / 100),
    0,
  );
  const grandTotal = subtotal - discount + vat;
  const itemTableBody: TableCell[][] = [
    [
      { text: "ÜRÜN / HİZMET", style: "tableHeader" },
      { text: "ADET", style: "tableHeader", alignment: "center" },
      { text: "BİRİM FİYAT", style: "tableHeader", alignment: "right" },
      { text: "İNDİRİM", style: "tableHeader", alignment: "right" },
      { text: "KDV", style: "tableHeader", alignment: "right" },
      { text: "TUTAR", style: "tableHeader", alignment: "right" },
    ],
    ...quote.items.map((item, index): TableCell[] => [
      { text: item.name, bold: true, margin: [0, 4, 0, 4], fillColor: index % 2 ? "#FAFAFC" : "#FFFFFF" },
      { text: String(item.qty), alignment: "center", margin: [0, 4, 0, 4], fillColor: index % 2 ? "#FAFAFC" : "#FFFFFF" },
      { text: quoteMoney(item.price), alignment: "right", margin: [0, 4, 0, 4], fillColor: index % 2 ? "#FAFAFC" : "#FFFFFF" },
      { text: `%${item.discount}`, alignment: "right", margin: [0, 4, 0, 4], fillColor: index % 2 ? "#FAFAFC" : "#FFFFFF" },
      { text: `%${item.vat}`, alignment: "right", margin: [0, 4, 0, 4], fillColor: index % 2 ? "#FAFAFC" : "#FFFFFF" },
      { text: quoteMoney(lineTotal(item)), bold: true, alignment: "right", margin: [0, 4, 0, 4], fillColor: index % 2 ? "#FAFAFC" : "#FFFFFF" },
    ]),
  ];

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 42, 42, 48],
    info: {
      title: `${quote.id} - Teklifio Fiyat Teklifi`,
      author: company.companyName,
      subject: `${customer.company} fiyat teklifi`,
      keywords: "teklif, fiyat teklifi, teklifio",
    },
    defaultStyle: { font: "Roboto", fontSize: 9, color: "#343142" },
    footer: (currentPage, pageCount) => ({
      margin: [42, 12, 42, 0],
      columns: [
        { text: `${company.companyName} · ${company.email}`, color: "#8B8798", fontSize: 7.5 },
        { text: `${currentPage} / ${pageCount}`, alignment: "right", color: "#8B8798", fontSize: 7.5 },
      ],
    }),
    content: [
      {
        columns: [
          {
            width: "*",
            stack: [
              company.logoDataUrl ? { image: company.logoDataUrl, width: 72, height: 36, fit: [72, 36] } : {
                columns: [
                  {
                    width: 32,
                    canvas: [
                      { type: "rect", x: 0, y: 0, w: 30, h: 30, r: 7, color: brandColor },
                    ],
                  },
                  {
                    width: "auto",
                    margin: [7, 5, 0, 0],
                    text: [
                      { text: "teklif", bold: true, fontSize: 17, color: "#1B1830" },
                      { text: "io", bold: true, fontSize: 17, color: brandColor },
                    ],
                  },
                ],
              },
              { text: company.companyName, bold: true, margin: [0, 14, 0, 3] },
              { text: company.address, color: "#777383", fontSize: 8 },
              { text: `${company.email}${company.phone ? ` · ${company.phone}` : ""}`, color: "#777383", fontSize: 8 },
              { text: `${company.website}${company.taxNumber ? ` · Vergi: ${company.taxOffice} / ${company.taxNumber}` : ""}`, color: "#777383", fontSize: 8 },
            ],
          },
          {
            width: 190,
            alignment: "right",
            stack: [
              { text: "FİYAT TEKLİFİ", bold: true, fontSize: 20, color: "#1B1830", characterSpacing: 1.2 },
              { text: quote.id, bold: true, color: brandColor, fontSize: 11, margin: [0, 5, 0, 15] },
              {
                table: {
                  widths: [72, 98],
                  body: [
                    [{ text: "Teklif tarihi", color: "#777383" }, { text: dateText(quote.date), bold: true }],
                    [{ text: "Geçerlilik", color: "#777383" }, { text: dateText(quote.validUntil), bold: true }],
                  ],
                },
                layout: "noBorders",
              },
            ],
          },
        ],
        margin: [0, 0, 0, 26],
      },
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                fillColor: "#F5F3FF",
                margin: [12, 10, 12, 10],
                stack: [
                  { text: "SAYIN", color: "#817C91", bold: true, fontSize: 7.5, characterSpacing: 1 },
                  { text: customer.company, bold: true, fontSize: 13, margin: [0, 4, 0, 3] },
                  { text: `${customer.name} · ${customer.email}${customer.phone ? ` · ${customer.phone}` : ""}`, color: "#6E697A", fontSize: 8.5 },
                ],
              },
            ],
          ],
        },
        layout: { hLineColor: () => "#E4E0FA", vLineColor: () => "#E4E0FA" },
        margin: [0, 0, 0, 24],
      },
      { text: "TEKLİF KALEMLERİ", style: "sectionTitle" },
      {
        table: {
          headerRows: 1,
          widths: ["*", 30, 65, 45, 35, 72],
          body: itemTableBody,
        },
        layout: {
          hLineColor: () => "#E8E6EE",
          vLineColor: () => "#E8E6EE",
          paddingLeft: () => 7,
          paddingRight: () => 7,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
        margin: [0, 8, 0, 22],
      },
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "TEKLİF NOTU", style: "sectionTitle" },
              {
                text: quote.note || "Belirtilen fiyatlara KDV dahildir. İş birliğiniz için teşekkür ederiz.",
                color: "#666273",
                lineHeight: 1.35,
                margin: [0, 7, 28, 0],
              },
            ],
          },
          {
            width: 220,
            table: {
              widths: [90, 110],
              body: [
                [{ text: "Ara toplam", color: "#777383" }, { text: quoteMoney(subtotal), bold: true, alignment: "right" }],
                [{ text: "İndirim", color: "#777383" }, { text: `- ${quoteMoney(discount)}`, bold: true, color: "#16845E", alignment: "right" }],
                [{ text: "KDV", color: "#777383" }, { text: quoteMoney(vat), bold: true, alignment: "right" }],
                [
                  { text: "GENEL TOPLAM", bold: true, color: "#FFFFFF", margin: [0, 4, 0, 4], fillColor: "#6756E8" },
                  { text: quoteMoney(grandTotal), bold: true, color: "#FFFFFF", fontSize: 12, alignment: "right", margin: [0, 3, 0, 3], fillColor: "#6756E8" },
                ],
              ],
            },
            layout: {
              hLineColor: () => "#E7E5ED",
              vLineColor: () => "#E7E5ED",
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 7,
              paddingBottom: () => 7,
            },
          },
        ],
        margin: [0, 0, 0, 30],
      },
      {
        unbreakable: true,
        stack: [
          { text: "ONAY VE İMZA", style: "sectionTitle", margin: [0, 0, 0, 12] },
          {
            table: {
              widths: ["*", "*"],
              heights: [68],
              body: [
                [
                  {
                    margin: [10, 9, 10, 9],
                    stack: [
                      { text: "TEKLİFİ HAZIRLAYAN", color: "#817C91", bold: true, fontSize: 7.5 },
                      { text: company.companyName, bold: true, margin: [0, 7, 0, 22] },
                      { text: "İmza / Kaşe", color: "#9A96A5", fontSize: 8 },
                    ],
                  },
                  {
                    margin: [10, 9, 10, 9],
                    stack: [
                      { text: "MÜŞTERİ ONAYI", color: "#817C91", bold: true, fontSize: 7.5 },
                      { text: `${customer.company} · ${customer.name}`, bold: true, margin: [0, 7, 0, 22] },
                      { text: "Ad Soyad / Tarih / İmza", color: "#9A96A5", fontSize: 8 },
                    ],
                  },
                ],
              ],
            },
            layout: { hLineColor: () => "#DCD9E4", vLineColor: () => "#DCD9E4" },
          },
          {
            text: `Bu teklif ${dateText(quote.validUntil)} tarihine kadar geçerlidir. Teklifin imzalanması, yukarıdaki kapsam ve koşulların kabul edildiği anlamına gelir.`,
            color: "#8B8798",
            fontSize: 7.5,
            lineHeight: 1.25,
            margin: [0, 10, 0, 0],
          },
          { text: company.footerText, color: "#8B8798", fontSize: 7.5, margin: [0, 5, 0, 0] },
        ],
      },
    ],
    styles: {
      sectionTitle: { fontSize: 8, bold: true, color: "#6756E8", characterSpacing: 1 },
      tableHeader: { fontSize: 7, bold: true, color: "#FFFFFF", fillColor: "#242035", margin: [0, 3, 0, 3] },
    },
  };

  const blob = await pdfMake.createPdf(docDefinition).getBlob();
  const pdfUrl = URL.createObjectURL(blob);

  if (previewWindow) {
    previewWindow.location.href = pdfUrl;
  }

  const downloadLink = document.createElement("a");
  downloadLink.href = pdfUrl;
  downloadLink.download = `${quote.id}-Teklif.pdf`;
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  if (!previewWindow) {
    window.location.href = pdfUrl;
  }

  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
}
