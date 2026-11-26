"use client";

import { useEffect, useId, useRef, useState } from "react";

export type ScanMode = "psa" | "seo" | "geo";

type Item = {
  icon: string;
  title: string;
  text: string;
  href?: string;         // a page; external links open in a new tab
  scan?: ScanMode;       // or: start this scan on the homepage
  accent?: string;
};

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: "Gratis scannen",
    items: [
      { icon: "🛡️", title: "PSA-scan", text: "Privacy, beveiliging en leeftijdsveiligheid", scan: "psa", accent: "#ffdd00" },
      { icon: "📈", title: "SEO-scan", text: "Techniek, titels, content en indexatie", scan: "seo" },
      { icon: "🌍", title: "GEO-scan", text: "Lokale vindbaarheid en AI-zichtbaarheid", scan: "geo" },
      { icon: "🏅", title: "Trust Badge", text: "Na je PSA-scan: een verifieerbare badge voor je site", scan: "psa" },
    ],
  },
  {
    title: "Dashboard",
    items: [
      { icon: "📊", title: "Scores en verloop", text: "Al je websites en hun scores over tijd", href: "/app" },
      { icon: "⚔️", title: "Concurrenten", text: "Wie staat net boven je, en waarom", href: "/app" },
      { icon: "🎚️", title: "Positie en wat als", text: "Zie waar je komt met betere scores", href: "/app" },
      { icon: "🔗", title: "Links en autoriteit", text: "Wie naar je linkt, vergeleken met de rest", href: "/app" },
      { icon: "🧭", title: "Site-audit", text: "Eerste 10 pagina's gratis, elke fout per URL", href: "/site-audit" },
    ],
  },
  {
    title: "Tools",
    items: [
      { icon: "🚀", title: "FajaedeSEO voor WordPress", text: "SEO, schema en audits in je eigen site", href: "https://www.fajaede.nl/download-fajaedeseo-ai-now-from-the-wordpress-repository/", accent: "#00ff99" },
      { icon: "🏗️", title: "Website Builder", text: "Een complete website met AI, de eerste is gratis", href: "https://www.fajaede.eu/builder" },
      { icon: "🔎", title: "Europese zoekmachine", text: "Zoeken zonder tracking, met eigen index", href: "https://www.fajaede.eu" },
      { icon: "🧹", title: "Privacy Cleaner", text: "Je browser grondig en veilig opschonen", href: "https://www.fajaede.nl/fajaede-privacy-cleaner-optimale-browser-opschoning/" },
      { icon: "🧩", title: "Developer API", text: "Scans en site-audits in je eigen software", href: "https://api.fajaede.eu/docs" },
    ],
  },
  {
    title: "Over Fajaede",
    items: [
      { icon: "🤖", title: "Onze bots", text: "FajaedeScan en FajaedeBot, en hoe je ze toelaat", href: "/bot" },
      { icon: "💬", title: "Community", text: "Fajaede Lab: vragen, tips en nieuws", href: "https://www.fajaede.nl/welkom-bij-fajaede-lab/" },
      { icon: "💶", title: "Prijzen", text: "Re-scans, site-audits en licenties", href: "/price" },
      { icon: "📄", title: "Voorwaarden en privacy", text: "Algemene voorwaarden en privacybeleid", href: "/voorwaarden" },
    ],
  },
];

/** "Producten" mega menu: opens on hover (mouse) and on click/Enter (touch, keyboard); Escape closes. */
export function MegaMenu({ onScan }: { onScan?: (mode: ScanMode) => void }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const hoverOpen = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;          // touch uses the click toggle
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverClose = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={wrapRef} className="mm" onPointerEnter={hoverOpen} onPointerLeave={hoverClose}>
      <button
        ref={buttonRef}
        type="button"
        className="mm-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        Producten
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div id={panelId} className="mm-panel" hidden={!open}>
        <button type="button" className="mm-close" onClick={() => { setOpen(false); buttonRef.current?.focus(); }}>
          Sluiten ✕
        </button>
        {COLUMNS.map((column) => (
          <div key={column.title} className="mm-col">
            <h2 className="mm-heading">{column.title}</h2>
            <ul className="mm-list">
              {column.items.map((item) => (
                <li key={item.title}>
                  <MenuLink item={item} onScan={onScan ? (mode) => { setOpen(false); onScan(mode); } : undefined}
                    onNavigate={() => setOpen(false)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuLink({ item, onScan, onNavigate }: { item: Item; onScan?: (mode: ScanMode) => void; onNavigate: () => void }) {
  const body = (
    <>
      <span className="mm-icon" aria-hidden="true">{item.icon}</span>
      <span className="mm-text">
        <span className="mm-title" style={item.accent ? { color: item.accent } : undefined}>{item.title}</span>
        <span className="mm-desc">{item.text}</span>
      </span>
    </>
  );
  if (item.scan) {
    const mode = item.scan;
    if (!onScan) {
      // on other pages: open the homepage with this scan selected (app/page.tsx reads ?scan=)
      return <a href={`/?scan=${mode}#scan`} className="mm-link" onClick={onNavigate}>{body}</a>;
    }
    return (
      <a href="#scan" className="mm-link" onClick={(event) => { event.preventDefault(); onScan(mode); }}>
        {body}
      </a>
    );
  }
  const external = item.href?.startsWith("http");
  return (
    <a href={item.href} className="mm-link" onClick={onNavigate}
      target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
      {body}
      {external && <span className="sr-only"> (opent in een nieuw tabblad)</span>}
    </a>
  );
}
