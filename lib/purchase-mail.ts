// Purchase confirmation with the invoice (or a Peppol notice for Belgian businesses),
// and the "create the Peppol invoice" email to the owner.
import type { Invoice } from "@prisma/client";
import { sendMail } from "@/lib/mailer";
import { TERMS_VERSION } from "@/lib/consent";
import { euro, formatDate, invoiceFilename, renderInvoicePdf, SELLER } from "@/lib/invoice-pdf";
import { isPeppolInvoice } from "@/lib/invoices";
import { parseEmailList } from "@/lib/accounting-report";

const FOOTER = `${SELLER.name} - ${SELLER.street}, 2600 Berchem, België - ${SELLER.vat}`;

function amountLines(invoice: Invoice): string {
  if (invoice.vatCents === 0) {
    return `Bedrag: ${euro(invoice.grossCents)}${invoice.reverseCharge ? " (btw verlegd, art. 196 Btw-richtlijn)" : " (0% btw)"}\n`;
  }
  return `Bedrag: ${euro(invoice.grossCents)} inclusief btw\n`
    + `Waarvan btw: ${euro(invoice.vatCents)} (exclusief btw: ${euro(invoice.netCents)})\n`;
}

/** Confirmation to the customer with the PDF invoice (Belgian businesses: invoice follows via Peppol). */
export async function sendPurchaseConfirmation(invoice: Invoice): Promise<void> {
  if (!invoice.customerEmail) return;
  const peppol = isPeppolInvoice(invoice);
  const isTest = invoice.mode !== "live";
  const consumer = invoice.customerType !== "onderneming";

  const text =
    (isTest ? "TESTBETALING (Mollie testmodus): er is geen geld ontvangen.\n\n" : "")
    + "Bedankt voor je aankoop bij FajaedeAI Core (psa.fajaede.nl).\n\n"
    + `Product: ${invoice.description}\n`
    + amountLines(invoice)
    + (peppol
      ? "Je factuur ontvang je binnen 5 werkdagen via Peppol.\n"
      : `Factuurnummer: ${invoice.number} (de factuur zit als PDF in de bijlage)\n`)
    + `Betaald op: ${formatDate(invoice.createdAt)} via Mollie (${invoice.paymentId})\n\n`
    + (consumer
      ? "Je hebt vóór de betaling uitdrukkelijk ingestemd met directe levering van deze digitale "
        + "inhoud en erkend dat je daardoor je herroepingsrecht verliest "
        + "(art. VI.53, 13° Wetboek van economisch recht).\n\n"
      : "")
    + `Algemene voorwaarden (versie ${TERMS_VERSION}): https://psa.fajaede.nl/voorwaarden\n\n`
    + `${FOOTER}\n`;

  const attachments = peppol
    ? undefined
    : [{
      filename: invoiceFilename(invoice),
      content: Buffer.from(await renderInvoicePdf(invoice)),
      contentType: "application/pdf",
    }];

  await sendMail({
    to: invoice.customerEmail,
    subject: `Bevestiging van je aankoop${peppol ? "" : ` (factuur ${invoice.number})`} - FajaedeAI Core`,
    text,
    attachments,
  });
}

/** Owner: create the Peppol invoice in the accounting software for a Belgian business. */
export async function notifyPeppolInvoice(invoice: Invoice): Promise<void> {
  // INVOICE_NOTIFY_EMAIL may list several addresses (e.g. accountant + owner): one mail each.
  const recipients = parseEmailList(process.env.INVOICE_NOTIFY_EMAIL?.trim() || process.env.SMTP_FROM?.trim() || "");
  const isTest = invoice.mode !== "live";
  for (const to of recipients) await sendMail({
    to,
    subject: `${isTest ? "[TEST - geen factuur] " : ""}Factuur maken via Peppol: ${invoice.customerName ?? invoice.customerEmail} (psa.fajaede.nl)`,
    text:
      (isTest
        ? "TESTBETALING (Mollie testmodus): er is geen geld ontvangen. Maak hiervoor GEEN factuur.\n\n"
        : "Een Belgisch bedrijf heeft betaald op psa.fajaede.nl. Maak de factuur in je boekhoudprogramma "
          + "en verstuur hem via Peppol (binnen 5 werkdagen).\n\n")
      + `Referentie:   ${invoice.number} (geen factuurnummer; gebruik het nummer uit je boekhoudprogramma)\n`
      + `Klant:        ${invoice.customerName ?? ""}\n`
      + `Adres:        ${invoice.customerAddress ?? ""}\n`
      + `Btw-nummer:   ${invoice.customerVat ?? ""} (gecontroleerd via VIES)\n`
      + `E-mail:       ${invoice.customerEmail ?? ""}\n\n`
      + `Product:      ${invoice.description}\n`
      + `Excl. btw:    ${euro(invoice.netCents)}\n`
      + `Btw:          ${euro(invoice.vatCents)}\n`
      + `Totaal:       ${euro(invoice.grossCents)} (al betaald)\n`
      + `Betaald op:   ${formatDate(invoice.createdAt)} via Mollie (${invoice.paymentId})\n`,
  });
}
