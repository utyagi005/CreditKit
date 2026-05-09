import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { OpportunityDetail } from '@creditkit/types';
import { api } from '../api.js';

export function OpportunityDetailPage() {
  const { id } = useParams();
  const [o, setO] = useState<OpportunityDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'liquidity' | 'solvency' | 'structure'>('liquidity');

  useEffect(() => {
    if (!id) return;
    api
      .opportunity(id)
      .then(setO)
      .catch((e: Error) => setErr(e.message));
  }, [id]);

  if (err || !id) {
    return <p className="text-warn">{err ?? 'Missing id'}</p>;
  }
  if (!o) return <p className="text-ink-500">Loading analysis…</p>;

  const corp = o.corporate;
  const infra = o.infrastructure;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-start">
        <div>
          <p className="text-xs uppercase text-accent">{o.type}</p>
          <h1 className="font-display text-3xl font-semibold text-white mt-1">{o.name}</h1>
          <p className="text-ink-500 mt-1">
            {o.sector}
            {o.industry ? ` · ${o.industry}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/opportunities/${o.id}/memo`}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Investment memo
          </Link>
          <Link to="/" className="rounded-md border border-ink-700 px-4 py-2 text-sm text-mist hover:bg-ink-900">
            Back
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Metric label="Risk rating" value={o.riskRating} />
        <Metric label="Spread" value={`${o.yieldSpreadBps} bps`} />
        <Metric label="YTM" value={`${o.ytmPct}%`} />
        <Metric label="Analytics" value={o.analyticsSource === 'python' ? 'Python svc' : 'Local'} />
      </div>

      <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
        <h2 className="font-display text-lg text-white">Computed metrics</h2>
        <dl className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-ink-500">Debt / EBITDA</dt>
            <dd className="text-mist font-medium text-lg">
              {o.computed.debtToEbitda != null ? `${o.computed.debtToEbitda.toFixed(2)}x` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">Interest coverage</dt>
            <dd className="text-mist font-medium text-lg">
              {o.computed.interestCoverage != null ? `${o.computed.interestCoverage.toFixed(2)}x` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">DSCR</dt>
            <dd className="text-mist font-medium text-lg">
              {o.computed.dscr != null ? `${o.computed.dscr.toFixed(2)}x` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">PD (model)</dt>
            <dd className="text-mist font-medium text-lg">{o.computed.probabilityOfDefaultPct.toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-ink-500">Recovery (model)</dt>
            <dd className="text-mist font-medium text-lg">{o.computed.recoveryRatePct.toFixed(1)}%</dd>
          </div>
          {o.ltvPct != null && (
            <div>
              <dt className="text-ink-500">LTV</dt>
              <dd className="text-mist font-medium text-lg">{o.ltvPct}%</dd>
            </div>
          )}
        </dl>
      </div>

      <div>
        <div className="flex gap-2 border-b border-ink-700">
          {(['liquidity', 'solvency', 'structure'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize -mb-px border-b-2 ${
                tab === t ? 'border-accent text-white' : 'border-transparent text-ink-500 hover:text-mist'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="rounded-b-xl border border-t-0 border-ink-700 bg-ink-900 p-5 text-sm text-mist leading-relaxed">
          {tab === 'liquidity' && (
            <p>
              {corp
                ? `Cash of $${corp.cash.toFixed(1)}m vs. interest burden $${corp.interestExpenseTtm.toFixed(1)}m (TTM). FCF $${corp.fcfTtm.toFixed(1)}m supports near-term liquidity; stress liquidity on delayed receivables and capex creep.`
                : infra
                  ? `Contracted revenue ${infra.contractedRevenuePct}% with ${infra.ppaYearsRemaining} years on PPA-like structures; liquidity supported by dedicated DSRA assumptions in base case.`
                  : '—'}
            </p>
          )}
          {tab === 'solvency' && (
            <p>
              {corp
                ? `Leverage at ${o.computed.debtToEbitda != null ? o.computed.debtToEbitda.toFixed(2) : '—'}x net debt/EBITDA. Solvency hinges on EBITDA durability through the cycle and refinancing wall in ${corp.debtMaturityProfileYears.join(', ')} years.`
                : infra
                  ? `Project solvency anchored on DSCR ${o.computed.dscr != null ? o.computed.dscr.toFixed(2) : '—'}x and regulatory risk score ${infra.regulatoryRiskScore}.`
                  : '—'}
            </p>
          )}
          {tab === 'structure' && (
            <p>
              <span className="text-white font-medium">Covenants: </span>
              {o.covenantSummary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-lg font-medium text-white mt-1">{value}</p>
    </div>
  );
}
