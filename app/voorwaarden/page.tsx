import Link from "next/link";
import { COMPANY, CompanyBlock, LegalPage, Section, legalStyles as s } from "@/components/LegalPage";

export const metadata = {
  title: "Algemene voorwaarden | psa.fajaede.nl",
  description: "Algemene voorwaarden en herroepingsbeleid voor psa.fajaede.nl: scans, PSA-licentie, re-scans en dashboard.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Algemene voorwaarden" updated="18 november 2026">
      <Section title="1. Wie zijn wij en wanneer gelden deze voorwaarden?">
        <p style={s.p}>psa.fajaede.nl is een dienst van:</p>
        <CompanyBlock />
        <p style={s.p}>
          Deze voorwaarden gelden voor elk gebruik van psa.fajaede.nl: de gratis scans, het dashboard, de PSA-licentie
          (Trust Badge) en de SEO/GEO re-scans. Door een scan uit te voeren, een account te gebruiken of een aankoop te
          doen, aanvaardt u deze voorwaarden. Dwingende rechten die u als consument heeft, blijven altijd van toepassing.
        </p>
      </Section>

      <Section title="2. De diensten">
        <ul style={s.ul}>
          <li>
            <strong>Gratis scans (PSA, SEO, GEO):</strong> een automatische controle van één pagina van een openbare
            website op privacy, beveiliging, content, zoekmachine- en AI-vindbaarheid, met een score en bevindingen.
          </li>
          <li>
            <strong>Dashboard:</strong> een gratis account waarmee u een beperkt aantal websites volgt (momenteel 3),
            opnieuw laat scannen en de scores over tijd bekijkt. U logt in via een eenmalige inloglink per e-mail en bent
            verantwoordelijk voor het gebruik van uw account.
          </li>
          <li>
            <strong>PSA-licentie:</strong> maakt de Trust Badge van een gescande website &quot;geverifieerd&quot;. De
            licentie geldt per website, voor één jaar na betaling, en wordt niet automatisch verlengd.
          </li>
          <li>
            <strong>Re-scan en Re-scan + adviezen:</strong> een site-audit van de opgegeven website (maximaal 50
            respectievelijk 100 pagina&apos;s) met een online rapport van de verbeterpunten per pagina, plus een nieuwe
            SEO- of GEO-scan. De audit volgt robots.txt; pagina&apos;s die de website voor onze scanner afschermt, worden
            niet bekeken. Bij Re-scan + adviezen plannen wij daarnaast per e-mail een adviesgesprek met u in.
          </li>
        </ul>
        <p style={s.p}>
          U mag alleen websites laten scannen waarvoor u dat redelijkerwijs mag, en de dienst niet geautomatiseerd of
          overmatig belasten. Om misbruik te voorkomen gelden limieten op het aantal scans en inlogpogingen. Bij misbruik
          mogen wij de toegang blokkeren.
        </p>
      </Section>

      <Section title="3. Wat een scan wel en niet is">
        <p style={s.p}>
          Scans worden automatisch uitgevoerd en geven een <strong>indicatie</strong> op basis van wat op het moment van de
          scan publiek zichtbaar is. Ze zijn geen juridisch advies, geen volledige beveiligingsaudit en geen garantie dat
          een website veilig is, aan de AVG voldoet of goed scoort in zoekmachines of AI-diensten. Controleer belangrijke
          bevindingen zelf of laat ze door een specialist beoordelen.
        </p>
        <p style={s.p}>
          De Trust Badge toont het resultaat van onze scan en de status van de licentie. Hij mag alleen worden gebruikt op
          de website waarvoor hij is afgegeven en niet op een manier die bezoekers misleidt. Bij misbruik mogen wij de
          badge uitschakelen.
        </p>
      </Section>

      <Section title="4. Prijzen en betaling">
        <ul style={s.ul}>
          <li>
            De prijzen staan bij het product en worden vóór het betalen getoond, inclusief btw en uitgesplitst naar
            bedrag exclusief btw en btw.
          </li>
          <li>
            Particulieren in de EU betalen de btw van hun land. Bedrijven uit een andere EU-lidstaat met een geldig
            btw-nummer betalen de prijs exclusief btw; de btw wordt verlegd naar de afnemer (artikel 196 van Richtlijn
            2006/112/EG). Btw-nummers controleren wij via VIES. Belgische bedrijven betalen de prijs inclusief Belgische
            btw. U bent verantwoordelijk voor de juistheid van de opgegeven gegevens.
          </li>
          <li>
            Betalingen verlopen via onze betaaldienstverlener Mollie. Wij ontvangen geen kaart- of bankgegevens. Koopt u
            als bedrijf, dan ontvangt u een factuur op basis van de opgegeven bedrijfsnaam, het adres en het btw-nummer.
          </li>
          <li>Alle aankopen zijn eenmalige betalingen, geen abonnementen.</li>
        </ul>
      </Section>

      <Section title="5. Levering en herroepingsrecht">
        <p style={s.p}>
          De PSA-licentie en de re-scans zijn digitale diensten. De licentie wordt direct na de bevestiging van uw betaling
          door Mollie geactiveerd; een re-scan wordt direct na betaling ingepland.
        </p>
        <p style={s.p}>
          Als consument heeft u in principe het recht om een overeenkomst op afstand binnen 14 dagen zonder opgave van
          redenen te herroepen. Bij het afrekenen vragen wij u uitdrukkelijk om de dienst direct te leveren en te erkennen
          dat u daardoor uw herroepingsrecht verliest. Is de dienst daarna volledig geleverd, zoals bij de direct
          geactiveerde PSA-licentie, dan kunt u de aankoop niet meer herroepen (artikel VI.53, 1° en 13° van het
          Wetboek van economisch recht). Herroept u een re-scan of adviesgesprek voordat deze volledig is uitgevoerd, dan
          betalen wij het deel dat nog niet is geleverd binnen 14 dagen terug (artikel VI.51).
        </p>
        <p style={s.p}>
          Koopt u als onderneming, dan geldt geen herroepingsrecht. Uw wettelijke rechten bij een gebrekkige dienst
          blijven altijd van toepassing.
        </p>
      </Section>

      <Section title="6. Beschikbaarheid en wijzigingen">
        <p style={s.p}>
          Wij doen ons best om psa.fajaede.nl beschikbaar en correct te houden, maar kunnen geen ononderbroken werking
          garanderen. Websites die scans blokkeren (bijvoorbeeld met een strenge firewall) kunnen wij niet altijd scannen.
          Wij mogen de gratis diensten, zoals het aantal websites in het dashboard, aanpassen. Wat u al heeft gekocht,
          leveren wij zoals afgesproken.
        </p>
      </Section>

      <Section title="7. Aansprakelijkheid">
        <p style={s.p}>
          Wij zijn niet aansprakelijk voor schade die ontstaat doordat u op een scanresultaat vertrouwt zonder het te
          controleren, of voor indirecte schade zoals gederfde winst of omzet. Onze aansprakelijkheid is in elk geval
          beperkt tot het bedrag dat u in de 12 maanden vóór de schade aan ons heeft betaald. Deze beperkingen gelden niet
          bij opzet of grove fout, en laten de dwingende rechten van consumenten onverlet.
        </p>
      </Section>

      <Section title="8. Persoonsgegevens">
        <p style={s.p}>
          Hoe wij met persoonsgegevens omgaan, leest u in het <Link href="/privacy" style={s.link}>privacybeleid</Link> en
          het <Link href="/cookies" style={s.link}>cookiebeleid</Link>.
        </p>
      </Section>

      <Section title="9. Klachten en geschillen">
        <p style={s.p}>
          Heeft u een klacht, mail dan naar <a href={`mailto:${COMPANY.email}`} style={s.link}>{COMPANY.email}</a>. Wij
          antwoorden binnen 14 dagen. Komen wij er samen niet uit, dan kunt u als consument terecht bij de
          Consumentenombudsdienst,{" "}
          <a href="https://consumentenombudsdienst.be" target="_blank" rel="noopener noreferrer" style={s.link}>consumentenombudsdienst.be</a>.
        </p>
        <p style={s.p}>
          Op deze voorwaarden is Belgisch recht van toepassing. Bent u consument in een ander EU-land, dan behoudt u de
          bescherming van de dwingende regels van uw land. Geschillen met ondernemingen worden voorgelegd aan de bevoegde
          rechtbanken van Antwerpen.
        </p>
      </Section>
    </LegalPage>
  );
}
