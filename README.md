# PSA – psa.fajaede.nl

Scanner en dashboard voor **Privacy, Security & Age (PSA)**, **SEO** en **GEO** (vindbaarheid in AI-zoekdiensten).
Bezoekers scannen gratis een website, kopen een PSA-licentie voor een geverifieerde Trust Badge of een uitgebreide
SEO/GEO re-scan, en volgen hun websites over tijd in een dashboard.

Live: <https://psa.fajaede.nl> · Een dienst van fajaede (BE1032407424).

## Functies

- **Scans** – PSA (`/api/scan`), SEO (`/api/seo`) en GEO (`/api/geo`) van één pagina, met rapport en score.
  Elke scan wordt bewaard als meting (`ScanSnapshot`) voor de scoregeschiedenis.
- **Trust Badge** – afbeelding via `/embed/psa?id=…`, linkt naar het rapport; "UNVERIFIED" zonder licentie.
- **Betalingen** – Mollie (PSA-licentie en re-scans), btw per land (OSS), verlegde btw voor EU-bedrijven via VIES,
  bedrijfsnaam en -adres bij B2B, verplichte toestemming voor voorwaarden en directe levering.
- **Dashboard** (`/app`) – inloggen met een e-mail-link (geen wachtwoord), tot 3 websites volgen, herscannen,
  scoregrafiek en laatste bevindingen.
- **Weekrapport voor de boekhouder** – elke donderdag een CSV met alle betaalde live-verkopen (zelfde kolommen als
  fajaede.eu en de FajaedeSEO-plugin).
- **Beheer** – `/admin` en `/dashboard`, afgeschermd met HTTP Basic auth.
- **Juridisch** – `/privacy`, `/cookies`, `/voorwaarden`. Pas deze teksten aan als de verwerking van gegevens verandert.

## Techniek

| Onderdeel | Keuze |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`); productie op **Neon, Frankfurt (eu-central-1)** |
| Hosting | Vercel (serverfuncties in Frankfurt) |
| Betalingen | Mollie |
| E-mail | Resend (domein `mail.fajaede.nl`, EU-regio); SMTP als terugval |
| Botbescherming | Cloudflare Turnstile op scan- en inlogformulieren |
| Overig | Google Web Risk (phishing/malware-check van URL's), Meilisearch (benchmark) |

> Deze Next.js-versie wijkt af van oudere versies (bijvoorbeeld `proxy.ts` in plaats van `middleware.ts`).
> Lees bij twijfel de documentatie in `node_modules/next/dist/docs/` (zie `AGENTS.md`).

## Lokaal ontwikkelen

Vereist: Node.js 22+, Docker Desktop.

```bash
npm install
docker compose -f docker-compose.dev.yml up -d   # lokale Postgres 17 op localhost:5432
```

Maak `.env.development.local` (wordt niet gecommit) met minimaal:

```bash
DATABASE_URL=postgresql://psa:psa@localhost:5432/psa_dev
DEV_LOG_LOGIN_LINKS=1          # inloglinks in de terminal i.p.v. per mail
PSA_APP_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=  # leeg = Turnstile uit
TURNSTILE_SECRET_KEY=
```

Zet het schema in de lokale database en start de app:

```bash
DATABASE_URL=postgresql://psa:psa@localhost:5432/psa_dev npx prisma db push
npm run dev
```

Open <http://localhost:3000>. Inloggen op `/login`: de link verschijnt in de terminal van `npm run dev`.
Next.js staat maar één dev-server per projectmap toe.

Mollie-betalingen lukken lokaal niet volledig: Mollie accepteert geen webhook op `localhost`.

## Database en schemawijzigingen

- Het schema staat in `prisma/schema.prisma`.
- **Bij elke Vercel-build** draait `prisma/repair-production.sql` (zie `buildCommand` in `vercel.json`). Dat script
  maakt ontbrekende tabellen, kolommen en types aan en zet oude kolomtypes om. Het is idempotent: het mag elke deploy
  opnieuw draaien.
- Een schemawijziging doe je dus zo:
  1. pas `schema.prisma` aan;
  2. voeg dezelfde wijziging idempotent toe aan `repair-production.sql` (`CREATE TABLE IF NOT EXISTS`,
     `ADD COLUMN IF NOT EXISTS`, …) en leg de SQL vast in een nieuwe map in `prisma/migrations/`;
  3. test lokaal: het script twee keer draaien en daarna
     `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` (0 = gelijk).
- Een mislukt repair-script laat de build falen; de vorige deploy blijft dan online.

## Omgevingsvariabelen

Zie `.env.example` voor alle namen. Waarden staan alleen in Vercel en in lokale `.env*`-bestanden, nooit in git.

| Variabele | Waarvoor |
| --- | --- |
| `DATABASE_URL` | Postgres (productie: pooled Neon-verbinding) |
| `MOLLIE_API_KEY` / `MOLLIE_TEST_KEY` | Mollie: productie gebruikt `MOLLIE_API_KEY`, overige omgevingen `MOLLIE_TEST_KEY` |
| `RESEND_API_KEY`, `RESEND_EMAIL_DOMAIN` | e-mail via Resend (gezet door de Vercel Marketplace-koppeling) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | terugval-mail; `SMTP_FROM` is ook het antwoordadres |
| `ACCOUNTANT_EMAIL` | ontvanger van het weekrapport |
| `CRON_SECRET` | beveiligt `/api/cron/accounting-report` (Vercel Cron stuurt hem mee) |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Basic auth voor `/admin` en `/dashboard` (wachtwoord min. 16 tekens) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile; leeg = uit |
| `GOOGLE_WEB_RISK_API_KEY` | URL-reputatie; zonder sleutel is de reputatie "unknown" |
| `RATE_LIMIT_HASH_SECRET` | geheim voor het hashen van IP's/e-mails in de rate limiter |
| `PSA_APP_URL` | basis-URL voor links in mails, badges en Mollie-redirects |
| `BENCHMARK_API_KEY` (en optioneel `BENCHMARK_API_URL`) | percentielen uit de Fajaede-benchmark (api.fajaede.eu, zie BENCHMARK.md daar) |

## Deployen

Elke push naar `main` deployt automatisch naar productie op Vercel. Controleer vooraf lokaal:

```bash
npx tsc --noEmit
npx next build --webpack
```

## Geplande taak

Vercel Cron roept dagelijks om 07:00 UTC `/api/cron/accounting-report` aan. Die route:

- ruimt verlopen gegevens op (`lib/data-retention.ts`): rate-limit-tellers na 2 dagen, verlopen inloglinks en sessies;
- verstuurt vanaf donderdag één keer per week het weekrapport.

Handmatig (PowerShell: gebruik `curl.exe`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://psa.fajaede.nl/api/cron/accounting-report?days=7&download=1" -o verkopen.csv
curl -H "Authorization: Bearer $CRON_SECRET" "https://psa.fajaede.nl/api/cron/accounting-report?days=7&send=1"
```

## Projectstructuur (belangrijkste delen)

```text
app/
  api/scan, api/seo, api/geo     scans
  api/checkout                   PSA-licentie (Mollie)
  api/premium/create-payment     SEO/GEO re-scans (Mollie)
  api/premium/webhook            Mollie-webhook: status, licenties, verkopen (Sale)
  api/cron/accounting-report     dagelijkse taak (opruimen + weekrapport)
  app/                           dashboard (/app), server actions in app/app/actions.ts
  login/, auth/verify/           inloggen met e-mail-link
  report/[id]/                   rapport + embedcode Trust Badge
  embed/psa/                     Trust Badge-afbeelding
  privacy/, cookies/, voorwaarden/
components/                      o.a. VatCheckout, ScoreHistoryChart, Turnstile
lib/
  session.ts                     inlogtokens en sessies (alleen gehasht opgeslagen)
  scan-guard.ts                  SSRF-bescherming en rate limiter
  scan-history.ts                scoregeschiedenis
  mailer.ts                      e-mail (Resend, terugval SMTP)
  accounting-report.ts           weekrapport
  vat.ts, consent.ts             btw-berekening, toestemming bij afrekenen
prisma/
  schema.prisma, repair-production.sql, migrations/
proxy.ts                         toegang tot /app (sessie) en /admin (Basic auth)
```

## Beveiliging

- Geen geheimen in de code of in git; de repo is openbaar.
- Inlogtokens, sessie-ID's en rate-limit-sleutels worden alleen gehasht opgeslagen.
- Server actions controleren zelf de sessie (ze zijn ook buiten hun pagina aan te roepen).
- Scans weigeren privé-adressen en interne hosts (`lib/scan-guard.ts`).
- Security-headers en anti-framing staan in `next.config.js`; `/embed/psa` blijft in een iframe te laden voor oude badges.
