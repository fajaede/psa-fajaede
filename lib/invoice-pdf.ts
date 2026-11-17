// PDF invoice (Dutch, A4) with all mandatory Belgian invoice details.
// Pure module: no database or Next.js imports, so it can be tested on its own.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const SELLER = {
  name: "fajaede",
  street: "Lodewijk de Koninckstraat 31",
  city: "2600 Berchem (Antwerpen)",
  country: "België",
  vat: "BE1032407424",
  email: "info@fajaede.nl",
  website: "psa.fajaede.nl",
};

export type InvoiceForPdf = {
  number: string;
  paymentId: string;
  mode: string;
  description: string;
  customerName: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  customerVat: string | null;
  netCents: number;
  vatCents: number;
  grossCents: number;
  vatRateBasisPoints: number;
  reverseCharge: boolean;
  treatment: string | null;
  createdAt: Date;
};

/** The standard PDF fonts only cover WinAnsi: keep Latin-1 and €, replace anything else. */
function safe(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E -ÿ€]/g, "?");
}

export function euro(cents: number): string {
  const [whole, dec] = (cents / 100).toFixed(2).split(".");
  return `€ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${dec}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("nl-BE", {
    timeZone: "Europe/Brussels", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(date).replace(/\//g, "-");
}

export function invoiceFilename(invoice: { number: string }): string {
  return `Factuur_${invoice.number}.pdf`;
}

export async function renderInvoicePdf(invoice: InvoiceForPdf): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Factuur ${invoice.number}`);
  pdf.setAuthor(SELLER.name);
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const isTest = invoice.mode !== "live";
  const date = formatDate(invoice.createdAt);
  const left = 50;
  const right = 545;
  let y = 790;

  const text = (value: string, x: number, size = 10, useBold = false) => {
    page.drawText(safe(value), { x, y, size, font: useBold ? bold : font, color: rgb(0.1, 0.1, 0.15) });
  };
  const textRight = (value: string, xRight: number, size = 10, useBold = false) => {
    const f = useBold ? bold : font;
    const s = safe(value);
    page.drawText(s, { x: xRight - f.widthOfTextAtSize(s, size), y, size, font: f, color: rgb(0.1, 0.1, 0.15) });
  };

  text(isTest ? "FACTUUR (TEST - geen geldige factuur)" : "FACTUUR", left, 20, true);
  y -= 34;

  const sellerLines = [SELLER.name, SELLER.street, SELLER.city, SELLER.country,
    `Ondernemings- en btw-nummer: ${SELLER.vat}`, SELLER.email, SELLER.website];
  const detailLines = [`Factuurnummer: ${invoice.number}`, `Factuurdatum: ${date}`, "Status: betaald"];
  const top = y;
  for (const line of sellerLines) { text(line, left); y -= 14; }
  const afterSeller = y;
  y = top;
  for (const line of detailLines) { text(line, 330); y -= 14; }
  y = Math.min(afterSeller, y) - 16;

  text("Klant", left, 11, true);
  y -= 16;
  const customerLines = [invoice.customerName, invoice.customerAddress, invoice.customerEmail,
    invoice.customerVat ? `Btw-nummer: ${invoice.customerVat}` : null];
  for (const line of customerLines.filter((l, i) => l && customerLines.indexOf(l) === i)) { // no duplicates
    text(line as string, left); y -= 14;
  }
  y -= 18;

  // Line table
  page.drawRectangle({ x: left, y: y - 6, width: right - left, height: 20, color: rgb(0.945, 0.96, 0.976) });
  text("Omschrijving", left + 6, 10, true);
  textRight("Bedrag excl. btw", right - 6, 10, true);
  y -= 22;
  const description = safe(invoice.description);
  const maxWidth = 360;
  let shown = description;
  while (font.widthOfTextAtSize(shown, 10) > maxWidth && shown.length > 4) shown = shown.slice(0, -2);
  if (shown !== description) shown = `${shown.trimEnd()}...`;
  text(shown, left + 6);
  textRight(euro(invoice.netCents), right - 6);
  y -= 10;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.5, color: rgb(0.8, 0.83, 0.87) });
  y -= 20;

  const rateLabel = invoice.reverseCharge
    ? "Btw verlegd (0%)"
    : invoice.vatRateBasisPoints === 0
      ? "Btw 0%"
      : `Btw ${(invoice.vatRateBasisPoints / 100).toLocaleString("nl-BE", { maximumFractionDigits: 2 })}%`;
  for (const [label, cents, useBold] of [
    ["Subtotaal excl. btw", invoice.netCents, false],
    [rateLabel, invoice.vatCents, false],
    [invoice.vatCents === 0 ? "Totaal te betalen" : "Totaal incl. btw", invoice.grossCents, true],
  ] as const) {
    text(label, 330, 10, useBold);
    textRight(euro(cents), right - 6, 10, useBold);
    y -= 16;
  }
  y -= 14;

  const notes: string[] = [];
  if (invoice.reverseCharge) {
    notes.push("Btw verlegd naar de afnemer (art. 196 Richtlijn 2006/112/EG). De afnemer voldoet de btw.");
  } else if (invoice.treatment === "outside-eu") {
    notes.push("Dienst buiten de EU: geen Belgische btw verschuldigd.");
  }
  notes.push(`Betaald via Mollie op ${date} (betaling ${invoice.paymentId}). Er is geen bedrag meer verschuldigd.`);
  if (isTest) notes.push("TESTBETALING (Mollie testmodus): er is geen geld ontvangen. Dit is geen factuur.");
  for (const note of notes) { text(note, left, 9); y -= 13; }

  return pdf.save();
}
