// Dutch texts for the SEO/GEO audit of api.fajaede.eu. The API stays English for developers;
// psa translates by the stable check `code`. Unknown codes or texts fall back to the original.

const LABELS: Record<string, string> = {
  title: "Paginatitel",
  meta_description: "Meta-omschrijving",
  headings: "Kopstructuur",
  content: "Leesbare inhoud",
  canonical: "Canonieke URL",
  indexability: "Indexeerbaarheid",
  structured_data: "Gestructureerde data",
  image_alt: "Alt-tekst bij afbeeldingen",
  mobile_language: "Mobiel en taal",
  crawl_files: "robots.txt en sitemap.xml",
  local_business_schema: "LocalBusiness-gegevens",
  postal_address: "Volledig adres",
  business_phone: "Telefoonnummer",
  map: "Kaartverwijzing",
  coordinates: "Geografische coördinaten",
  service_area: "Werkgebied of regio",
  business_identity: "Bedrijfsnaam en profielen",
  reviews: "Reviews",
  nap_markup: "Naam, adres en telefoon (NAP)",
};

/** Fixed texts: [text when passed, text when failed]. */
const FIXED: Record<string, [string, string]> = {
  canonical: ["Canonieke link gevonden.", "Geen canonieke link gevonden."],
  indexability: [
    "Geen noindex of robots.txt-blokkade gevonden; de pagina laadt correct.",
    "Een noindex-instructie, robots.txt-blokkade of foutcode (HTTP) gevonden.",
  ],
  structured_data: ["JSON-LD of microdata gevonden.", "Geen JSON-LD of microdata gevonden."],
  local_business_schema: ["LocalBusiness-JSON-LD gevonden.", "Geen LocalBusiness-JSON-LD gevonden."],
  postal_address: [
    "Gestructureerd adres (straat, plaats, postcode) of een ingevuld adres-element gevonden.",
    "Geen volledig gestructureerd adres of adres-element gevonden.",
  ],
  business_phone: [
    "Gestructureerd telefoonnummer of klikbare tel:-link gevonden.",
    "Geen gestructureerd telefoonnummer of tel:-link gevonden.",
  ],
  map: ["Google Maps-link of -kaart gevonden.", "Geen Google Maps-link of -kaart gevonden."],
  coordinates: [
    "Gestructureerde coördinaten of geografische meta-tags gevonden.",
    "Geen gestructureerde coördinaten of geografische meta-tags gevonden.",
  ],
  service_area: [
    "Gestructureerd werkgebied of regio in het bedrijfsadres gevonden.",
    "Geen gestructureerd werkgebied of regio gevonden.",
  ],
  business_identity: [
    "Het lokale bedrijf heeft een naam en sameAs-links naar profielen.",
    "Geen lokaal bedrijf met naam en sameAs-links naar profielen (bijv. Google, LinkedIn) gevonden.",
  ],
  reviews: ["Gestructureerde reviews of beoordelingen gevonden.", "Geen gestructureerde reviews of beoordelingen gevonden."],
  nap_markup: [
    "Naam, volledig adres en telefoon staan samen in de LocalBusiness-gegevens.",
    "Naam, volledig adres en telefoon staan niet samen in de gegevens van de pagina.",
  ],
};

const num = (text: string, re: RegExp): string | null => text.match(re)?.[1] ?? null;

function dynamicDetails(code: string, en: string): string | null {
  switch (code) {
    case "title": {
      const n = num(en, /^(\d+) characters/);
      return n === null ? null : `${n} tekens; aanbevolen is 10-60.`;
    }
    case "meta_description": {
      const n = num(en, /^(\d+) characters/);
      return n === null ? null : `${n} tekens; aanbevolen is 70-160.`;
    }
    case "headings": {
      const n = num(en, /^(\d+) H1/);
      return n === null ? null : `${n} H1-kop(pen); ${/no H2/.test(en) ? "geen H2-koppen gevonden" : "H2-koppen gevonden"}.`;
    }
    case "content": {
      const n = num(en, /^(\d+) visible words/);
      return n === null ? null : `${n} zichtbare woorden; minimaal 300 aanbevolen.`;
    }
    case "image_alt": {
      const m = en.match(/^(\d+) of (\d+) images/);
      return m ? `${m[1]} van ${m[2]} afbeeldingen hebben een alt-tekst.` : null;
    }
    case "mobile_language": {
      const viewport = /Viewport present/.test(en) ? "aanwezig" : "ontbreekt";
      const lang = /language present/.test(en) ? "aanwezig" : "ontbreekt";
      return `Viewport ${viewport}; taal van de pagina (lang) ${lang}.`;
    }
    case "crawl_files":
      return en
        .replace(/not checked/g, "niet gecontroleerd")
        .replace(/ at (https?:\/\/\S+?);/g, " op $1;")
        .replace("valid sitemap XML found", "geldige sitemap-XML gevonden")
        .replace("valid sitemap XML not confirmed", "geldige sitemap-XML niet bevestigd")
        .replace("sitemap XML niet gecontroleerd", "sitemap-XML niet gecontroleerd");
    default:
      return null;
  }
}

export function checkLabelNl(code: string, label: string): string {
  return LABELS[code] ?? label;
}

export function checkDetailsNl(code: string, passed: boolean | null, details: string): string {
  const fixed = FIXED[code];
  if (fixed && passed !== null) return passed ? fixed[0] : fixed[1];
  return dynamicDetails(code, details) ?? details;
}

const LIMITATIONS: Record<string, string> = {
  "This is an on-page HTML audit, not a whole-site crawl.":
    "Dit is een controle van de HTML van één pagina, geen crawl van de hele site.",
  "Google Business Profile ownership, map-pack rankings, and NAP consistency across external directories are not verified.":
    "Eigendom van het Google-bedrijfsprofiel, posities in Google Maps en gelijke NAP-gegevens in externe gidsen worden niet gecontroleerd.",
  "Core Web Vitals and real-user performance require a separate Lighthouse or PageSpeed Insights measurement.":
    "Core Web Vitals en echte laadsnelheid vragen een aparte meting met Lighthouse of PageSpeed Insights.",
  "AI search citations and generative-engine visibility are not measured by this local GEO score.":
    "Vermeldingen in AI-zoekmachines worden niet gemeten in deze lokale GEO-score.",
};

export function limitationNl(text: string): string {
  return LIMITATIONS[text] ?? text;
}
