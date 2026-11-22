import { LegalPage, Section, COMPANY, legalStyles as s } from "@/components/LegalPage";
import { CRAWLER_NAME, CRAWLER_USER_AGENT, SCANNER_NAME, SCANNER_USER_AGENT } from "@/lib/scanner";

export const metadata = {
  title: "Onze bots: FajaedeScan en FajaedeBot | psa.fajaede.nl",
  description: "Wat FajaedeScan en FajaedeBot doen, hoe je ze herkent, en hoe je ze in Cloudflare toelaat of blokkeert.",
  alternates: { canonical: "/bot" },
};

const code: React.CSSProperties = {
  display: "block", whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#111", border: "1px solid #2a2a2a",
  borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#f0efec", margin: "0 0 12px",
};

export default function BotPage() {
  return (
    <LegalPage title="Onze bots: FajaedeScan en FajaedeBot" updated="18 november 2026">
      <Section title="Eén merk, twee namen">
        <p style={s.p}>
          fajaede gebruikt twee bots, ingedeeld naar wat ze doen. Ze horen bij psa.fajaede.nl en de Europese
          zoekmachine fajaede.eu.
        </p>
        <ul style={s.ul}>
          <li>
            <strong>{SCANNER_NAME}</strong> bekijkt één website <strong>op verzoek van een gebruiker</strong>: als
            iemand op psa.fajaede.nl een PSA-, SEO- of GEO-scan start, of als een eigenaar in het dashboard opnieuw
            scant. Per scan halen we de opgegeven pagina op, plus hooguit <code>robots.txt</code>,{" "}
            <code>llms.txt</code> en de sitemap. Net als bij een browser gebeurt dit alleen wanneer iemand erom vraagt.
          </li>
          <li>
            <strong>{CRAWLER_NAME}</strong> crawlt <strong>zelfstandig</strong> voor de zoekindex van fajaede.eu en
            voor de Fajaede-benchmark (een paar pagina&apos;s per website). Hij volgt altijd <code>robots.txt</code>,
            wacht tussen pagina&apos;s van dezelfde site en neemt na een blokkade langer pauze.
          </li>
        </ul>
        <p style={s.p}>Voor de benchmark bewaren we geen volledige pagina&apos;s, alleen de meetresultaten.</p>
      </Section>

      <Section title="Herkennen">
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr><th style={s.th}>Bot</th><th style={s.th}>User-agent</th></tr></thead>
            <tbody>
              <tr><td style={s.td}>{SCANNER_NAME}</td><td style={s.td}><code>{SCANNER_USER_AGENT}</code></td></tr>
              <tr><td style={s.td}>{CRAWLER_NAME}</td><td style={s.td}><code>{CRAWLER_USER_AGENT}</code></td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Echtheid controleren (Web Bot Auth)">
        <p style={s.p}>
          Een user-agent kan iedereen nabootsen. Daarom ondertekenen beide bots hun verzoeken digitaal (HTTP Message
          Signatures, Ed25519) met de headers <code>Signature</code>, <code>Signature-Input</code> en{" "}
          <code>Signature-Agent</code>. De openbare sleutels staan op:
        </p>
        <ul style={s.ul}>
          <li>{SCANNER_NAME}: <code>https://psa.fajaede.nl/.well-known/http-message-signatures-directory</code></li>
          <li>{CRAWLER_NAME}: <code>https://api.fajaede.eu/.well-known/http-message-signatures-directory</code></li>
        </ul>
      </Section>

      <Section title="Toelaten in Cloudflare">
        <p style={s.p}>
          Cloudflare blokkeert onbekende bots. Scan je je eigen website en krijg je de melding dat Cloudflare de site
          beschermt? Maak dan één regel aan die beide bots toelaat:
        </p>
        <ol style={s.ul}>
          <li>
            Cloudflare-dashboard → je domein → <strong>Security → Security rules</strong> (in de oudere weergave{" "}
            <strong>Security → WAF</strong>) → <strong>Custom rules → Create rule</strong>.
          </li>
          <li>Naam: <em>Fajaede toestaan</em>. Kies <strong>Edit expression</strong> en plak:</li>
        </ol>
        <code style={code}>(http.user_agent contains &quot;Fajaede&quot;)</code>
        <ol start={3} style={s.ul}>
          <li>
            Actie: <strong>Skip</strong>. Vink aan: <em>All Super Bot Fight Mode Rules</em>, <em>Browser Integrity
            Check</em>, <em>Security Level</em> en eventueel <em>All rate limiting rules</em>.
          </li>
          <li>Zet de regel bovenaan en kies <strong>Deploy</strong>.</li>
        </ol>
        <p style={s.p}>
          <strong>Gratis Cloudflare-abonnement:</strong> de eenvoudige <em>Bot Fight Mode</em> kan niet met een regel
          worden overgeslagen. Wil je onze scan toelaten, zet Bot Fight Mode dan uit. Of gebruik Super Bot Fight Mode
          (Pro of hoger), die de regel hierboven wel respecteert.
        </p>
        <p style={s.p}>
          Let op: een user-agent kan door iedereen worden nagebootst. Laat de regel daarom alleen bot-controles
          overslaan, niet je volledige firewall.
        </p>
      </Section>

      <Section title="Blokkeren">
        <p style={s.p}>
          {CRAWLER_NAME} volgt <code>robots.txt</code>. Met <code>User-agent: {CRAWLER_NAME}</code> en{" "}
          <code>Disallow: /</code> komt hij niet meer langs. Je eigen scans op psa.fajaede.nl blijven dan gewoon werken.
          Scans op verzoek ({SCANNER_NAME}) blokkeer je met een Cloudflare-regel met de actie <strong>Block</strong>{" "}
          op die user-agent.
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
