import Link from "next/link";
import { LegalPage, Section, legalStyles as s } from "@/components/LegalPage";

export const metadata = {
  title: "Cookiebeleid | psa.fajaede.nl",
  description: "Welke cookies en opslag psa.fajaede.nl gebruikt: alleen strikt noodzakelijk, geen tracking.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookiebeleid voor psa.fajaede.nl" updated="16 november 2026">
      <Section title="Kort gezegd">
        <p style={s.p}>
          psa.fajaede.nl gebruikt <strong>geen tracking-, analyse- of advertentiecookies</strong> en volgt u niet over
          andere websites. Een scan uitvoeren plaatst geen cookie. Alleen als u inlogt op het dashboard, plaatsen wij één
          cookie die strikt noodzakelijk is om u ingelogd te houden.
        </p>
        <p style={s.p}>
          Strikt noodzakelijke cookies en opslag mogen volgens de Europese en Belgische regels zonder toestemming worden
          gebruikt. Daarom tonen wij geen cookiebanner: er valt niets te weigeren dat niet nodig is voor de dienst die u
          zelf gebruikt.
        </p>
      </Section>

      <Section title="Wat wij op uw apparaat opslaan">
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Naam</th>
                <th style={s.th}>Soort</th>
                <th style={s.th}>Doel</th>
                <th style={s.th}>Bewaartermijn</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={s.td}><code>__Host-psa_session</code></td>
                <td style={s.td}>Cookie, strikt noodzakelijk, eigen cookie</td>
                <td style={s.td}>
                  U ingelogd houden op het dashboard. Bevat alleen een willekeurige code, geen persoonsgegevens. Niet
                  leesbaar voor scripts (HttpOnly), alleen via HTTPS verstuurd en alleen naar psa.fajaede.nl.
                  Wordt pas geplaatst nadat u op een inloglink heeft geklikt.
                </td>
                <td style={s.td}>30 dagen, of tot u uitlogt</td>
              </tr>
              <tr>
                <td style={s.td}><code>lastResult</code></td>
                <td style={s.td}>Lokale opslag in uw browser (localStorage), strikt noodzakelijk</td>
                <td style={s.td}>
                  Het resultaat van uw laatste scan bewaren, zodat de resultatenpagina het kan tonen. Bevat de gescande URL
                  en de scores. Wordt niet naar ons verstuurd.
                </td>
                <td style={s.td}>Tot uw volgende scan of tot u uw browsergegevens wist</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Diensten van derden">
        <ul style={s.ul}>
          <li>
            <strong>Cloudflare Turnstile (beveiliging):</strong> op de scan- en inlogformulieren controleren wij met
            Cloudflare Turnstile of u geen bot bent. Cloudflare verwerkt daarvoor technische browsergegevens en uw
            IP-adres, uitsluitend om misbruik te voorkomen, niet voor advertenties. Zie het{" "}
            <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" style={s.link}>privacybeleid van Cloudflare</a>.
          </li>
          <li>
            <strong>Mollie (betalen):</strong> bij een aankoop gaat u naar de betaalpagina van Mollie. Op die pagina gelden
            de cookie- en privacyregels van Mollie.
          </li>
          <li>
            <strong>Trust Badge:</strong> de badge op websites van klanten is een gewone afbeelding van onze server. Er
            worden geen cookies geplaatst bij bezoekers van die websites.
          </li>
          <li>
            <strong>Lettertypen:</strong> worden van onze eigen server geladen, niet van Google.
          </li>
        </ul>
      </Section>

      <Section title="Cookies beheren">
        <p style={s.p}>
          U kunt cookies en lokale opslag altijd via de instellingen van uw browser bekijken en verwijderen. Verwijdert of
          blokkeert u de sessiecookie, dan werkt scannen gewoon, maar moet u voor het dashboard opnieuw inloggen. Uw
          account en gevolgde websites blijven bewaard.
        </p>
        <p style={s.p}>
          Meer over hoe wij met gegevens omgaan leest u in het <Link href="/privacy" style={s.link}>privacybeleid</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
