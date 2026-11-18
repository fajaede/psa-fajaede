import { LegalPage, Section, COMPANY, legalStyles as s } from "@/components/LegalPage";
import { AUDIT_BOT_NAME, SCANNER_NAME, SCANNER_USER_AGENT } from "@/lib/scanner";

export const metadata = {
  title: "Onze scanner (FajaedePSA) | psa.fajaede.nl",
  description: "Wat de FajaedePSA-scanner en FajaedeAuditBot doen, en hoe je ze in Cloudflare toelaat of blokkeert.",
};

const code: React.CSSProperties = {
  display: "block", whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#111", border: "1px solid #2a2a2a",
  borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#f0efec", margin: "0 0 12px",
};

export default function BotPage() {
  return (
    <LegalPage title="Onze scanner: FajaedePSA en FajaedeAuditBot" updated="18 november 2026">
      <Section title="Wat doen ze?">
        <ul style={s.ul}>
          <li>
            <strong>{SCANNER_NAME}</strong> scant een website alleen <strong>op verzoek</strong>: als iemand op
            psa.fajaede.nl een PSA-, SEO- of GEO-scan start, of als een eigenaar in het dashboard opnieuw scant. Per scan
            halen we de opgegeven pagina op, plus hooguit <code>robots.txt</code>, <code>llms.txt</code> en de sitemap.
          </li>
          <li>
            <strong>{AUDIT_BOT_NAME}</strong> (api.fajaede.eu) berekent de SEO- en GEO-score en meet voor de
            Fajaede-benchmark een klein aantal pagina&apos;s per website. Hij volgt <code>robots.txt</code> en
            wacht tussen pagina&apos;s van dezelfde site.
          </li>
        </ul>
        <p style={s.p}>We slaan geen volledige pagina&apos;s op, alleen de meetresultaten.</p>
      </Section>

      <Section title="Herkennen">
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr><th style={s.th}>Bot</th><th style={s.th}>User-agent bevat</th></tr></thead>
            <tbody>
              <tr><td style={s.td}>{SCANNER_NAME}</td><td style={s.td}><code>{SCANNER_USER_AGENT}</code></td></tr>
              <tr><td style={s.td}>{AUDIT_BOT_NAME}</td><td style={s.td}><code>FajaedeAuditBot/1.0 (+https://api.fajaede.eu)</code></td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Toelaten in Cloudflare">
        <p style={s.p}>
          Cloudflare blokkeert onbekende bots. Scan je je eigen website en krijg je de melding dat Cloudflare de site
          beschermt? Maak dan één regel aan:
        </p>
        <ol style={s.ul}>
          <li>Cloudflare-dashboard → je domein → <strong>Security → WAF → Custom rules → Create rule</strong>.</li>
          <li>Naam: <em>Fajaede scanner toestaan</em>. Kies <strong>Edit expression</strong> en plak:</li>
        </ol>
        <code style={code}>(http.user_agent contains &quot;{SCANNER_NAME}&quot;) or (http.user_agent contains &quot;{AUDIT_BOT_NAME}&quot;)</code>
        <ol start={3} style={s.ul}>
          <li>
            Actie: <strong>Skip</strong>. Vink aan: <em>All Super Bot Fight Mode Rules</em>, <em>Browser Integrity
            Check</em>, <em>Security Level</em> en eventueel <em>All rate limiting rules</em>.
          </li>
          <li>Zet de regel bovenaan en kies <strong>Deploy</strong>.</li>
        </ol>
        <p style={s.p}>
          <strong>Gratis Cloudflare-abonnement:</strong> de eenvoudige <em>Bot Fight Mode</em> (Security → Bots) kan
          niet met een regel worden overgeslagen. Wil je onze scan toelaten, zet Bot Fight Mode dan uit. Of gebruik Super
          Bot Fight Mode (Pro of hoger), die de regel hierboven wel respecteert.
        </p>
        <p style={s.p}>
          Let op: een user-agent kan door iedereen worden nagebootst. Laat de regel daarom alleen bot-controles
          overslaan, niet je volledige firewall.
        </p>
      </Section>

      <Section title="Blokkeren">
        <p style={s.p}>
          {AUDIT_BOT_NAME} volgt <code>robots.txt</code>: met <code>User-agent: {AUDIT_BOT_NAME}</code> en{" "}
          <code>Disallow: /</code> komt hij niet meer langs. Scans op verzoek ({SCANNER_NAME}) blokkeer je met een
          Cloudflare-regel met de actie <strong>Block</strong> op dezelfde user-agent.
        </p>
      </Section>

      <Section title="Contact">
        <p style={s.p}>
          Vragen of overlast? Mail <a href={`mailto:${COMPANY.email}`} style={s.link}>{COMPANY.email}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
