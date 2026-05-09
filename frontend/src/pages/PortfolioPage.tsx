import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PortfolioSummary } from '@creditkit/types';
import { api } from '../api.js';

const COLORS = ['#2d6a4f', '#40916c', '#74c69d', '#95d5b2', '#bc6c25'];

export function PortfolioPage() {
  const [s, setS] = useState<PortfolioSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .portfolioSummary()
      .then(setS)
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) {
    return <p className="text-warn">{err}</p>;
  }
  if (!s) return <p className="text-ink-500">Loading portfolio…</p>;

  const pieData = s.bySector.map((x) => ({ name: x.sector, value: x.pct }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Portfolio monitoring</h1>
        <p className="mt-2 text-ink-500">Exposure, concentration, and maturity snapshot (seed portfolio).</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
          <p className="text-xs uppercase text-ink-500">Total notional</p>
          <p className="text-2xl font-semibold text-white mt-1">${s.totalNotional.toFixed(1)}m</p>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
          <p className="text-xs uppercase text-ink-500">Watchlist</p>
          <p className="text-2xl font-semibold text-warn mt-1">{s.watchlistCount}</p>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
          <p className="text-xs uppercase text-ink-500">Top issuer concentration</p>
          <p className="text-2xl font-semibold text-white mt-1">{s.concentrationTopIssuerPct}%</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
          <h2 className="font-display text-lg text-white mb-4">Sector allocation (%)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#141922', border: '1px solid #2a3344' }}
                  formatter={(v: number) => [`${v}%`, 'Weight']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
          <h2 className="font-display text-lg text-white mb-4">Risk rating mix</h2>
          <ul className="space-y-2">
            {s.byRiskRating.map((r) => (
              <li key={r.rating} className="flex justify-between text-sm border-b border-ink-700 pb-2">
                <span className="text-mist">{r.rating}</span>
                <span className="text-ink-500">{r.count} names</span>
              </li>
            ))}
          </ul>
          <h3 className="text-sm font-medium text-white mt-6 mb-2">Maturity / contract horizon</h3>
          <ul className="space-y-2 text-sm">
            {s.upcomingMaturities.map((m) => (
              <li key={m.opportunityId} className="flex justify-between">
                <Link className="text-accent hover:underline" to={`/opportunities/${m.opportunityId}`}>
                  {m.name}
                </Link>
                <span className="text-ink-500">{m.years} yrs</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
