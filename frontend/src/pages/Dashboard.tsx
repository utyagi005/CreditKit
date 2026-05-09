import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OpportunityListItem } from '@creditkit/types';
import { api } from '../api.js';

export function Dashboard() {
  const [rows, setRows] = useState<OpportunityListItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .opportunities()
      .then(setRows)
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) {
    return (
      <div className="rounded-lg border border-warn/40 bg-ink-900 p-6 text-warn">
        <p className="font-medium">Could not load opportunities</p>
        <p className="text-sm mt-2 opacity-90">{err}</p>
      </div>
    );
  }

  if (!rows) {
    return <p className="text-ink-500">Loading dashboard…</p>;
  }

  const spreadData = rows.map((r) => ({
    name: r.name.split(' ')[0],
    spread: r.yieldSpreadBps,
    risk: r.internalRiskScore,
  }));

  const sectorMap = new Map<string, number>();
  for (const r of rows) {
    sectorMap.set(r.sector, (sectorMap.get(r.sector) ?? 0) + 1);
  }
  const sectorData = [...sectorMap.entries()].map(([sector, count]) => ({ sector, count }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Credit opportunity dashboard</h1>
        <p className="mt-2 text-ink-500 max-w-2xl">
          Borrowers, structures, spreads, and internal risk scores — structured like an institutional pipeline
          review.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {rows.map((o) => (
          <Link
            key={o.id}
            to={`/opportunities/${o.id}`}
            className="block rounded-xl border border-ink-700 bg-ink-900 p-5 hover:border-accent/50 transition-colors"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-accent">{o.type}</p>
                <h2 className="font-display text-lg font-medium text-white mt-1">{o.name}</h2>
                <p className="text-sm text-ink-500 mt-1">{o.sector}</p>
              </div>
              {o.watchlist && (
                <span className="text-xs font-semibold text-warn border border-warn/40 rounded px-2 py-0.5">
                  Watch
                </span>
              )}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-ink-500">Rating</dt>
                <dd className="text-mist font-medium">{o.riskRating}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Spread</dt>
                <dd className="text-mist font-medium">{o.yieldSpreadBps} bps</dd>
              </div>
              <div>
                <dt className="text-ink-500">YTM</dt>
                <dd className="text-mist font-medium">{o.ytmPct}%</dd>
              </div>
              <div>
                <dt className="text-ink-500">Debt/EBITDA</dt>
                <dd className="text-mist font-medium">
                  {o.computed?.debtToEbitda != null ? o.computed.debtToEbitda.toFixed(2) + 'x' : '—'}
                </dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
          <h3 className="font-display text-lg text-white mb-4">Spread vs. risk score</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spreadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3344" />
                <XAxis dataKey="name" stroke="#5c6b83" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#5c6b83" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#5c6b83" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#141922', border: '1px solid #2a3344' }}
                  labelStyle={{ color: '#e8ecf2' }}
                />
                <Bar yAxisId="left" dataKey="spread" fill="#2d6a4f" name="Spread (bps)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="risk" fill="#bc6c25" name="Risk score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
          <h3 className="font-display text-lg text-white mb-4">Sector exposure (count)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3344" />
                <XAxis type="number" stroke="#5c6b83" />
                <YAxis type="category" dataKey="sector" width={120} stroke="#5c6b83" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#141922', border: '1px solid #2a3344' }}
                  labelStyle={{ color: '#e8ecf2' }}
                />
                <Bar dataKey="count" fill="#5c6b83" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
