import { SCANNER_USER_AGENT } from "@/lib/scanner";
import { signRequest } from "@/lib/web-bot-auth";

export type GenerativeVisibilityCheck = {
  code: string;
  label: string;
  status: "pass" | "warning" | "unknown" | "not-measured";
  details: string;
};

export type GenerativeVisibility = {
  checks: GenerativeVisibilityCheck[];
  citationsMeasured: false;
  limitations: string[];
};

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
];

const FETCH_TIMEOUT_MS = 1_500;

async function getText(url: string): Promise<{ status: number; text: string } | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
      redirect: "manual",
      headers: { Accept: "text/plain,text/html,application/xhtml+xml,*/*;q=0.8", "User-Agent": SCANNER_USER_AGENT, ...signRequest(url) },
    });
    return { status: response.status, text: response.ok ? await response.text() : "" };
  } catch {
    return null;
  }
}

function findStructuredTypes(html: string): Set<string> {
  const types = new Set<string>();
  const scripts = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi);

  const collect = (value: unknown, depth = 0): void => {
    if (depth > 20 || !value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) collect(item, depth + 1);
      return;
    }

    const record = value as Record<string, unknown>;
    const rawType = record["@type"];
    if (typeof rawType === "string") types.add(rawType.toLowerCase());
    if (Array.isArray(rawType)) {
      for (const item of rawType) if (typeof item === "string") types.add(item.toLowerCase());
    }
    for (const nested of Object.values(record)) collect(nested, depth + 1);
  };

  for (const match of scripts) {
    try {
      collect(JSON.parse(match[1]));
    } catch {
      // Invalid JSON-LD is not treated as usable structured data.
    }
  }
  return types;
}

function blockedAiCrawlers(robotsText: string): string[] {
  const groups: Array<{ agents: string[]; disallowsRoot: boolean; allowsRoot: boolean }> = [];
  let current: { agents: string[]; disallowsRoot: boolean; allowsRoot: boolean } | null = null;
  let hasRules = false;

  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.split("#", 1)[0].trim();
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const directive = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (directive === "user-agent") {
      if (!current || hasRules) {
        if (current) groups.push(current);
        current = { agents: [], disallowsRoot: false, allowsRoot: false };
        hasRules = false;
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (directive === "disallow" || directive === "allow")) {
      hasRules = true;
      if (value === "/") {
        if (directive === "disallow") current.disallowsRoot = true;
        else current.allowsRoot = true;
      }
    }
  }
  if (current) groups.push(current);

  return AI_CRAWLERS.filter((crawler) => {
    const specificGroups = groups.filter((group) => group.agents.includes(crawler.toLowerCase()));
    const applicableGroups = specificGroups.length > 0
      ? specificGroups
      : groups.filter((group) => group.agents.includes("*"));
    return applicableGroups.some((group) => group.disallowsRoot && !group.allowsRoot);
  });
}

/** AI-zichtbaarheid 0-100: share of passed checks; unknown/not-measured checks do not count. Null when nothing could be judged. */
export function aiVisibilityScore(checks: GenerativeVisibilityCheck[]): number | null {
  const judged = checks.filter((check) => check.status === "pass" || check.status === "warning");
  if (judged.length === 0) return null;
  return Math.round((judged.filter((check) => check.status === "pass").length / judged.length) * 100);
}

/** Snapshot details for the dashboard: improvement points plus all checks. */
export function aiSnapshotDetails(visibility: GenerativeVisibility) {
  return {
    issues: visibility.checks
      .filter((check) => check.status === "warning")
      .map((check) => `${check.label}: ${check.details}`),
    checks: visibility.checks.map(({ code, label, status, details }) => ({ code, label, status, details })),
  };
}

export async function getGenerativeVisibility(url: string, html?: string): Promise<GenerativeVisibility> {
  const origin = new URL(url).origin;
  const [robots, llms] = await Promise.all([
    getText(`${origin}/robots.txt`),
    getText(`${origin}/llms.txt`),
  ]);

  let pageHtml = html;
  if (pageHtml === undefined) {
    const page = await getText(url);
    pageHtml = page?.status === 200 ? page.text : "";
  }

  const checks: GenerativeVisibilityCheck[] = [];
  if (!robots) {
    checks.push({ code: "ai-crawlers", label: "Toegang AI-crawlers", status: "unknown", details: "robots.txt kon niet worden opgehaald; bottoegang is niet bevestigd." });
  } else if (robots.status === 404) {
    checks.push({ code: "ai-crawlers", label: "Toegang AI-crawlers", status: "pass", details: "Geen robots.txt gevonden; er is via robots.txt geen AI-crawlerblokkade aangetroffen." });
  } else if (robots.status !== 200) {
    checks.push({ code: "ai-crawlers", label: "Toegang AI-crawlers", status: "unknown", details: `robots.txt antwoordde met HTTP ${robots.status}; crawlerregels konden niet worden beoordeeld.` });
  } else {
    const blocked = blockedAiCrawlers(robots.text);
    checks.push(blocked.length === 0
      ? { code: "ai-crawlers", label: "Toegang AI-crawlers", status: "pass", details: "Geen expliciete blokkade voor de gecontroleerde AI-crawlers gevonden." }
      : { code: "ai-crawlers", label: "Toegang AI-crawlers", status: "warning", details: `Expliciet geblokkeerd in robots.txt: ${blocked.join(", ")}.` });
  }

  checks.push(llms?.status === 200 && llms.text.trim().length > 0
    ? { code: "llms-txt", label: "llms.txt", status: "pass", details: "Een niet-lege llms.txt is bereikbaar. Dit is een optionele, opkomende conventie; geen garantie op opname in AI-antwoorden." }
    : llms && llms.status !== 404 && llms.status !== 200
      ? { code: "llms-txt", label: "llms.txt", status: "unknown", details: `llms.txt antwoordde met HTTP ${llms.status}.` }
      : { code: "llms-txt", label: "llms.txt", status: "warning", details: "Geen llms.txt gevonden. Dit bestand is optioneel en heeft geen gegarandeerd effect op AI-citaties." });

  const lowerHtml = pageHtml.toLowerCase();
  const schemaTypes = findStructuredTypes(pageHtml);
  const usefulSchema = ["organization", "localbusiness", "article", "blogposting", "faqpage", "webpage", "product"]
    .filter((type) => schemaTypes.has(type));
  checks.push(usefulSchema.length > 0
    ? { code: "structured-data", label: "Schema.org-data", status: "pass", details: `Relevante JSON-LD gevonden: ${usefulSchema.join(", ")}.` }
    : { code: "structured-data", label: "Schema.org-data", status: "warning", details: "Geen geldige Organization-, Article-, FAQ-, WebPage- of Product-JSON-LD gevonden." });

  const headingCount = (lowerHtml.match(/<h[2-6]\b/g) || []).length;
  const hasFaqStructure = schemaTypes.has("faqpage") || /\b(faq|frequently asked questions|veelgestelde vragen)\b/i.test(pageHtml);
  if (headingCount >= 2 || hasFaqStructure) {
    const details = hasFaqStructure
      ? `Gestructureerde koppen gevonden (${headingCount} H2-H6) en FAQ-signaal aanwezig.`
      : `Gestructureerde koppen gevonden (${headingCount} H2-H6).`;
    checks.push({ code: "answer-structure", label: "Antwoordstructuur", status: "pass", details });
  } else {
    checks.push({
      code: "answer-structure",
      label: "Antwoordstructuur",
      status: "warning",
      details: "Weinig H2-H6-koppen of FAQ-signalen gevonden; duidelijke vraag-en-antwoordstructuur kan extractie vergemakkelijken.",
    });
  }

  const hasAuthor = schemaTypes.has("person") || /<meta\b[^>]*name=["']author["']/i.test(pageHtml) || /"author"\s*:/i.test(pageHtml);
  const hasPublishedDate = /"datePublished"\s*:/i.test(pageHtml) || /<time\b[^>]*datetime=/i.test(pageHtml);
  checks.push(hasAuthor || hasPublishedDate
    ? { code: "source-transparency", label: "Bron en actualiteit", status: "pass", details: `Broninformatie gevonden: ${[hasAuthor && "auteur", hasPublishedDate && "publicatiedatum"].filter(Boolean).join(" en ")}.` }
    : { code: "source-transparency", label: "Bron en actualiteit", status: "warning", details: "Geen herkenbare auteur of publicatiedatum gevonden op deze pagina." });

  checks.push({
    code: "actual-citations",
    label: "Werkelijke AI-citaties",
    status: "not-measured",
    details: "Deze on-page scan vraagt geen prompts op bij ChatGPT, Perplexity of Google AI Overviews en kan daadwerkelijke vermeldingen dus niet vaststellen.",
  });

  return {
    checks,
    citationsMeasured: false,
    limitations: [
      "Dit is een technische readiness-check van één URL, geen meting van zichtbaarheid of citaties in AI-zoekmachines.",
      "Werkelijke citaties vereisen een vaste set zoekvragen en toegang tot een externe zoek-/AI-provider of periodieke handmatige metingen.",
    ],
  };
}