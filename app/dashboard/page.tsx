// app/dashboard/page.tsx
import { isOwner } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import React from 'react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email ?? '';
  const authorized = isOwner(email);

  if (!authorized) {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>Access Denied</h1>
        <p style={styles.paragraph}>You are not authorized to view this dashboard.</p>
      </main>
    );
  }

  // fetch premium orders for this owner (simple list)
  const orders = await prisma.premiumOrder.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>Owner Dashboard</h1>
      <p style={styles.paragraph}>Welcome, {email}</p>
      <section style={styles.section}>
        <h2 style={styles.subTitle}>Premium Orders</h2>
        {orders.length === 0 ? (
          <p style={styles.paragraph}>No premium orders found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Tier</th>
                <th style={styles.th}>Price (€)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={styles.tr}>
                  <td style={styles.td}>{o.id}</td>
                  <td style={styles.td}>{o.tier}</td>
                  <td style={styles.td}>{(o.priceCents / 100).toFixed(2)}</td>
                  <td style={styles.td}>{o.status ?? 'PENDING'}</td>
                  <td style={styles.td}>{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '2rem',
    background: '#050505',
    color: '#f5f5f5',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  title: { fontSize: '2rem', marginBottom: '1rem' },
  paragraph: { marginBottom: '1rem' },
  subTitle: { fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' },
  section: { marginTop: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { borderBottom: '1px solid #444', padding: '0.5rem', textAlign: 'left' },
  td: { borderBottom: '1px solid #333', padding: '0.5rem' },
  tr: { background: 'transparent' },
};
