"use client";

import { ScoreBadge } from '@/components/ScoreBadge';
import { copyToClipboard } from '@/lib/clipboard';
import { useEffect, useState } from 'react';

interface CheckResult {
  name: string;
  passed: boolean;
  score?: number;
  message?: string;
}

interface ScanResult {
  trustScore?: number;
  criticalIssues?: number;
  checks?: CheckResult[];
  scanMode?: string;
  url?: string;
}

export default function ResultsClient() {
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('lastResult');
      if (stored) {
        try {
          const parsed: ScanResult = JSON.parse(stored);
          setResult(parsed);
        } catch (e) {
          console.error('Failed to parse stored result', e);
        }
      }
    }
  }, []);

  if (!result) {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>Resultaten niet gevonden</h1>
        <p style={styles.paragraph}>Er is nog geen scan uitgevoerd. Ga terug naar de homepagina en voer een scan uit.</p>
      </main>
    );
  }

  const { trustScore, criticalIssues, checks, scanMode, url } = result;

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>🔎 {scanMode?.toUpperCase() || 'Resultaat'} Scan</h1>
      {url && (
        <p style={styles.paragraph}>
          URL: <a href={url} target="_blank" rel="noopener noreferrer" style={styles.link}>{url}</a>
        </p>
      )}
      <section style={styles.summarySection}>
        <div style={styles.metricBox}>
          <h2 style={styles.metricTitle}>Trust Score</h2>
          <p style={styles.metricValue}>{trustScore ?? 'N/A'}</p>
          <ScoreBadge score={trustScore ?? 0} />
          <button
            onClick={() => copyToClipboard(`https://psa-fajaede.vercel.app/results?url=${encodeURIComponent(url || '')}&score=${trustScore}`)}
            style={styles.copyBtn}
          >
            Kopieer link
          </button>
        </div>
        <div style={styles.metricBox}>
          <h2 style={styles.metricTitle}>Critical Issues</h2>
          <p style={styles.metricValue}>{criticalIssues ?? 'N/A'}</p>
        </div>
      </section>
      <section style={styles.checksContainer}>
        <h2 style={styles.subTitle}>Audit Checks</h2>
        <div style={styles.checksGrid}>
          {checks?.map((c, i) => (
            <div key={i} className={c.passed ? 'checkPass' : 'checkFail'} style={styles.checkCard}>
              <h3 style={styles.checkName}>{c.name}</h3>
              <p style={styles.checkMessage}>{c.message ?? ''}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    margin: 0,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    background: 'linear-gradient(135deg, #0d0d0d, #1a1a2e)',
    color: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 16px 40px 16px',
  },
  title: {
    marginTop: 40,
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    color: '#ccc',
  },
  link: {
    color: '#00ff99',
    textDecoration: 'underline',
  },
  summarySection: {
    display: 'flex',
    gap: 24,
    marginTop: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metricBox: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(8px)',
    padding: '12px 24px',
    borderRadius: 12,
    textAlign: 'center',
    minWidth: 120,
    transition: 'transform 0.2s',
  },
  metricTitle: {
    fontSize: 14,
    marginBottom: 4,
    color: '#aaa',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 600,
    color: '#00ff99',
  },
  copyBtn: {
    padding: '0.5rem 1rem',
    background: '#00ff99',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    cursor: 'pointer',
    fontWeight: 600,
    marginTop: '0.5rem',
    transition: 'background 0.3s, transform 0.2s',
  },
  subTitle: {
    marginTop: 32,
    fontSize: 22,
    fontWeight: 600,
  },
  checksContainer: {
    width: '100%',
    maxWidth: 800,
    marginTop: 16,
  },
  checksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 16,
    marginTop: 12,
  },
  checkCard: {
    padding: '12px 16px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'scale(1.02)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    },
  },
  checkName: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },
  checkMessage: {
    fontSize: 14,
    color: '#ccc',
  },
};
