import Link from "next/link";
import { COMPANY, CompanyBlock, LegalPage, Section, legalStyles as s } from "@/components/LegalPage";

export const metadata = {
  title: "Privacybeleid | psa.fajaede.nl",
  description: "Welke persoonsgegevens psa.fajaede.nl verwerkt, waarom, hoe lang, met wie, en welke rechten u heeft.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacybeleid voor psa.fajaede.nl" updated="16 november 2026">
      <Section title="1. Wie zijn wij?">
        <p style={s.p}>
          psa.fajaede.nl (&quot;PSA&quot;, &quot;wij&quot;) is een dienst van {COMPANY.name}. PSA scant websites op privacy,
          beveiliging, content (PSA), SEO en GEO, toont daarvan rapporten en een Trust Badge, en biedt een dashboard
          waarin u de scores van uw websites over tijd volgt. Wij zijn de verwerkingsverantwoordelijke voor de
          persoonsgegevens die in dit beleid worden beschreven:
        </p>
        <CompanyBlock />
        <p style={s.p}>
          Wij gebruiken geen tracking-, analyse- of advertentiecookies, bouwen geen profielen van bezoekers op en
          verkopen geen gegevens. Wij nemen geen besluiten over u die uitsluitend op geautomatiseerde verwerking berusten.
        </p>
      </Section>

      <Section title="2. Welke gegevens verwerken wij, waarom en op welke grondslag?">
        <ul style={s.ul}>
          <li>
            <strong>Scans van websites.</strong> De URL die u laat scannen en de resultaten (scores en bevindingen over die
            website). Dit zijn in de regel gegevens over een website, niet over u. Wij gebruiken ze om het rapport, de
            Trust Badge en de scoregeschiedenis te tonen. Grondslag: uitvoering van de dienst die u aanvraagt.
          </li>
          <li>
            <strong>Dashboard-account.</strong> Uw e-mailadres, de websites die u volgt en de scoregeschiedenis daarvan.
            Om in te loggen sturen wij u een eenmalige inloglink; wij bewaren daarvan alleen een versleutelde (gehashte)
            code. Na het inloggen plaatsen wij één noodzakelijke sessiecookie (zie het{" "}
            <Link href="/cookies" style={s.link}>cookiebeleid</Link>). Grondslag: uitvoering van de overeenkomst.
          </li>
          <li>
            <strong>Aankopen.</strong> Bij een PSA-licentie of een SEO/GEO re-scan verwerken wij uw e-mailadres, het
            bedrag, uw land en klanttype (particulier of bedrijf), en bij een bedrijf de bedrijfsnaam, het factuuradres en
            het btw-nummer. Wij leggen ook vast dat en wanneer u akkoord ging met de voorwaarden en de directe levering.
            Wij ontvangen en bewaren geen kaart- of bankrekeningnummers; de betaling verloopt via Mollie (zie punt 4).
            Grondslag: uitvoering van de overeenkomst en wettelijke verplichtingen (boekhouding en btw).
          </li>
          <li>
            <strong>Btw-controle.</strong> Een opgegeven btw-nummer controleren wij via VIES, de dienst van de Europese
            Commissie. Grondslag: wettelijke verplichting.
          </li>
          <li>
            <strong>Beveiliging en misbruikpreventie.</strong> Om te voorkomen dat de scanner, het inloggen of het
            herscannen wordt misbruikt, houden wij per IP-adres, e-mailadres of account tellers bij. Daarvoor bewaren wij
            alleen een versleutelde (gehashte) waarde, niet het IP- of e-mailadres zelf. Op de scan- en inlogformulieren
            gebruiken wij Cloudflare Turnstile om bots te herkennen. Onze hostingpartij houdt technische serverlogs bij
            (onder meer IP-adres en tijdstip). Grondslag: gerechtvaardigd belang (beveiliging van de dienst).
          </li>
          <li>
            <strong>Trust Badge op websites van klanten.</strong> Bezoekers van een website waarop een Trust Badge staat,
            laden de badge-afbeelding van onze server. Daarbij ziet onze hostingpartij, zoals bij elke afbeelding op
            internet, het IP-adres in de serverlogs. Er worden geen cookies geplaatst. Grondslag: gerechtvaardigd belang
            (het tonen van de badge).
          </li>
          <li>
            <strong>Contact.</strong> Als u ons mailt, gebruiken wij uw bericht en e-mailadres om te antwoorden.
            Grondslag: gerechtvaardigd belang.
          </li>
        </ul>
      </Section>

      <Section title="3. Hoe lang bewaren wij gegevens?">
        <ul style={s.ul}>
          <li>Inloglinks: 15 minuten geldig en eenmalig; ze worden uiterlijk een dag na het verlopen verwijderd.</li>
          <li>Sessies: 30 dagen, of tot u uitlogt; verlopen sessies worden dagelijks verwijderd.</li>
          <li>Tellers voor misbruikpreventie (gehasht): uiterlijk na 2 dagen verwijderd.</li>
          <li>
            Account, gevolgde websites en scoregeschiedenis: zolang uw account bestaat. Vraagt u ons uw account te
            verwijderen, dan verwijderen wij uw e-mailadres, sessies en gevolgde websites.
          </li>
          <li>
            Gegevens van aankopen en facturen: zolang de Belgische boekhoud- en btw-wetgeving dat vereist (in de regel
            10 jaar).
          </li>
          <li>Serverlogs: volgens de bewaartermijnen van onze hostingpartij, in de regel enkele dagen.</li>
        </ul>
      </Section>

      <Section title="4. Met wie delen wij gegevens?">
        <p style={s.p}>
          Wij delen gegevens alleen met partijen die nodig zijn om de dienst te leveren. Verwerkers werken in onze opdracht
          en volgens onze instructies.
        </p>
        <ul style={s.ul}>
          <li>
            <strong>Vercel</strong> (hosting van de website en de servers; verwerker). Onze serverfuncties draaien in
            Frankfurt (EU).
          </li>
          <li>
            <strong>Neon</strong> (database-hosting: opslag van accounts, scans en aankopen; verwerker). De database
            staat in de EU, in Frankfurt (AWS-regio eu-central-1).
          </li>
          <li>
            <strong>Resend</strong> (verzending van inloglinks en servicemails vanaf mail.fajaede.nl, via de EU-regio in
            Ierland; verwerker). Resend ontvangt uw e-mailadres en de inhoud van de mail.
          </li>
          <li>
            <strong>Mollie</strong> (betalingen). Mollie verwerkt uw betaalgegevens als zelfstandige
            verwerkingsverantwoordelijke volgens het{" "}
            <a href="https://www.mollie.com/nl/privacy" target="_blank" rel="noopener noreferrer" style={s.link}>privacybeleid van Mollie</a>.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> (botdetectie op de scan- en inlogformulieren). Cloudflare verwerkt
            technische browsergegevens en uw IP-adres uitsluitend om misbruik te herkennen; zie het{" "}
            <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" style={s.link}>privacybeleid van Cloudflare</a>.
          </li>
          <li>
            <strong>Google Web Risk</strong>. De URL van een gescande website sturen wij naar Google om te controleren of
            die op een phishing- of malwarelijst staat. Er worden geen gegevens over u meegestuurd.
          </li>
          <li><strong>Europese Commissie (VIES)</strong> voor de controle van btw-nummers.</li>
          <li>
            <strong>Onze boekhouder</strong>, die wekelijks een overzicht van de verkopen ontvangt (bedragen, btw, land,
            e-mailadres of bedrijfsgegevens), voor onze boekhouding en btw-aangifte.
          </li>
          <li>
            <strong>Mijndomein</strong> (ons e-mailpakket), voor de mailbox {COMPANY.email} waar uw antwoorden en vragen
            binnenkomen.
          </li>
        </ul>
        <p style={s.p}>
          Vercel, Neon, Resend en Cloudflare zijn Amerikaanse bedrijven. Waar gegevens buiten de Europese Economische Ruimte
          kunnen worden verwerkt, gebeurt dat op basis van het EU-VS Data Privacy Framework of de
          standaardcontractbepalingen van de Europese Commissie. Wij geven geen gegevens aan anderen, tenzij de wet ons
          daartoe verplicht.
        </p>
      </Section>

      <Section title="5. Beveiliging">
        <p style={s.p}>
          Alle verbindingen zijn versleuteld (HTTPS). Inloglinks en sessiecodes slaan wij alleen versleuteld (gehasht) op,
          tellers voor misbruikpreventie eveneens. De beheeromgeving is afgeschermd met een wachtwoord en alleen
          toegankelijk voor ons.
        </p>
      </Section>

      <Section title="6. Uw rechten">
        <p style={s.p}>
          Onder de Algemene Verordening Gegevensbescherming (AVG) heeft u het recht op inzage, rectificatie,
          verwijdering en beperking van de verwerking van uw persoonsgegevens, op overdraagbaarheid van gegevens die u
          zelf heeft verstrekt, en het recht om bezwaar te maken tegen verwerking op grond van ons gerechtvaardigd belang.
          Stuur uw verzoek naar <a href={`mailto:${COMPANY.email}`} style={s.link}>{COMPANY.email}</a>, bij voorkeur
          vanaf het e-mailadres van uw account. Wij antwoorden binnen één maand. Gegevens die wij wettelijk moeten
          bewaren, zoals factuurgegevens, kunnen wij pas na afloop van de bewaartermijn verwijderen.
        </p>
        <p style={s.p}>
          Bent u het niet eens met hoe wij met uw gegevens omgaan, dan kunt u een klacht indienen bij de
          Gegevensbeschermingsautoriteit, Drukpersstraat 35, 1000 Brussel,{" "}
          <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer" style={s.link}>www.gegevensbeschermingsautoriteit.be</a>.
          Woont u in een ander EU-land, dan kunt u ook terecht bij de toezichthouder in uw land.
        </p>
      </Section>

      <Section title="7. Wijzigingen">
        <p style={s.p}>
          Wij passen dit beleid aan als onze dienst verandert. De datum bovenaan toont de laatste wijziging. Bij
          belangrijke wijzigingen informeren wij accounthouders per e-mail.
        </p>
      </Section>
    </LegalPage>
  );
}
