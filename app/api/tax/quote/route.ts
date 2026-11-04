import { NextResponse } from "next/server";
import { calculateVatInclusiveQuote, VatQuoteError } from "@/lib/vat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const quote = await calculateVatInclusiveQuote({
      product: body.product,
      countryCode: body.countryCode,
      ipCountryCode: request.headers.get("x-vercel-ip-country"),
      customerType: body.customerType,
      vatNumber: body.vatNumber,
    });
    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof VatQuoteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("VAT quote failed:", error);
    return NextResponse.json({ error: "De btw-berekening is mislukt." }, { status: 500 });
  }
}