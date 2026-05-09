import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpportunityListItem } from '@creditkit/types';
import { api } from '../api.js';
import { useParallax, useRevealOnView, useSectionProgress } from '../components/scroll.js';

export function Dashboard() {
  const [rows, setRows] = useState<OpportunityListItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const parallaxY = useParallax(0.08);
  const storyRef = useRef<HTMLElement | null>(null);
  const storyP = useSectionProgress(storyRef);

  const highlights = useRevealOnView<HTMLDivElement>({ threshold: 0.2 });
  const analysis = useRevealOnView<HTMLDivElement>({ threshold: 0.2 });
  const monitoring = useRevealOnView<HTMLDivElement>({ threshold: 0.2 });
  const ai = useRevealOnView<HTMLDivElement>({ threshold: 0.2 });

  useEffect(() => {
    api
      .opportunities()
      .then(setRows)
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) {
    return (
      <div className="mx-auto my-16 max-w-[1120px] rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
        <p className="font-medium">Could not load opportunities</p>
        <p className="mt-2 text-sm opacity-90">{err}</p>
      </div>
    );
  }

  if (!rows) {
    return <p className="mx-auto my-16 max-w-[1120px] text-zinc-500">Loading experience…</p>;
  }

  const spreadData = [...rows].sort((a, b) => a.yieldSpreadBps - b.yieldSpreadBps).map((r) => ({
    name: r.name.split(' ')[0],
    spread: r.yieldSpreadBps,
  }));

  const sectorMap = new Map<string, number>();
  for (const r of rows) {
    sectorMap.set(r.sector, (sectorMap.get(r.sector) ?? 0) + 1);
  }
  const sectorData = [...sectorMap.entries()].map(([sector, count]) => ({ sector, count })).slice(0, 4);
  const top = [...rows].sort((a, b) => b.yieldSpreadBps - a.yieldSpreadBps)[0];

  return (
    <div className="bg-white text-zinc-900">
      <section className="relative overflow-hidden border-b border-zinc-100">
        <div className="hero-shine" style={{ transform: `translateY(${parallaxY}px)` }} />
        <div className="grain" />
        <div className="relative mx-auto grid min-h-[calc(100svh-44px)] max-w-[1120px] place-items-center px-4 py-16">
          <div className="text-center fade-up">
            <p className="text-sm font-medium tracking-wide text-zinc-500">CreditKit</p>
            <h1 className="mx-auto mt-4 max-w-4xl text-5xl font-semibold tracking-tight text-zinc-950 md:text-7xl">
              The institutional credit workflow.
              <span className="block text-zinc-500">Now in one modern platform.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-600 md:text-lg">
              Analyze private corporate and infrastructure credit with rigorous bottom-up analytics,
              portfolio intelligence, and memo-ready recommendations.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <a
                href="#highlights"
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                Explore highlights
              </a>
              <a
                href="#analysis"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                See analysis engine
              </a>
            </div>
          </div>

          <div className="mt-14 w-full max-w-5xl">
            <div
              className="relative mx-auto h-[380px] w-full max-w-4xl rounded-[48px] border border-zinc-200 bg-white shadow-[0_45px_140px_-55px_rgba(0,0,0,0.38)]"
              style={{ transform: `translateY(${Math.round(parallaxY * 0.35)}px)` }}
            >
              <div className="absolute left-10 top-10 right-10 h-16 rounded-2xl bg-zinc-50" />
              <div className="absolute bottom-10 left-10 right-10 top-32 rounded-3xl border border-zinc-100 bg-[linear-gradient(180deg,#f8fbff,#ffffff)] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-zinc-500">Live spread intelligence</p>
                  <p className="text-xs text-zinc-400">updated now</p>
                </div>
                <div className="h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spreadData}>
                      <defs>
                        <linearGradient id="spreadFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2b67f6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#2b67f6" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '14px',
                          border: '1px solid #e4e4e7',
                          background: 'rgba(255,255,255,0.96)',
                        }}
                      />
                      <Area type="monotone" dataKey="spread" stroke="#2b67f6" fill="url(#spreadFill)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="highlights" className="mx-auto max-w-[1120px] px-4 py-24">
        <div ref={highlights.ref} className={`reveal ${highlights.visible ? 'is-visible' : ''}`}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm text-zinc-500">Get the highlights.</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
              Built for how credit teams actually work.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Feature
              title="Credit scoring you can defend"
              body="Debt/EBITDA, coverage, PD and recovery signals, mapped back to the underlying drivers and covenants."
            />
            <Feature
              title="Infrastructure-native underwriting"
              body="DSCR, contract tenor, regulatory sensitivity, and inflation linkage — aligned to project finance practice."
            />
            <Feature
              title="Memo-ready outputs"
              body="Institutional memo sections for thesis, risks, covenants, relative value, and recommendation — generated cleanly."
            />
          </div>
        </div>
      </section>

      <section id="analysis" ref={storyRef} className="bg-zinc-950 py-28 text-white">
        <div ref={analysis.ref} className={`mx-auto max-w-[1120px] px-4 reveal ${analysis.visible ? 'is-visible' : ''}`}>
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="text-sm tracking-wide text-zinc-400">Bottom-up engine</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Precision analysis.
                <span className="block text-zinc-400">At institutional depth.</span>
              </h2>
              <p className="mt-5 max-w-xl text-zinc-300">
                Liquidity, solvency, capital structure and refinancing diagnostics — designed to match the
                way investment committees actually decide.
              </p>
              <div className="mt-8 flex items-center gap-3 text-sm text-zinc-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-4 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2b67f6]" />
                  Risk signals
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-4 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  Covenant lens
                </span>
              </div>
            </div>

            <div className="rounded-[44px] border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-xs tracking-wide text-zinc-500">Scroll-synced signal</p>
                <p className="text-xs text-zinc-400">{Math.round(storyP * 100)}%</p>
              </div>
              <div className="mt-6 h-2 rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-[#2b67f6] transition-all duration-300"
                  style={{ width: `${Math.round(storyP * 100)}%` }}
                />
              </div>

              <p className="mt-8 text-xs tracking-wide text-zinc-500">Highest spread opportunity</p>
              <h3 className="mt-3 text-2xl font-semibold">{top?.name ?? 'N/A'}</h3>
              <dl className="mt-6 grid grid-cols-2 gap-5 text-sm">
                <Metric label="Yield spread" value={`${top?.yieldSpreadBps ?? 0} bps`} />
                <Metric label="Risk score" value={`${top?.internalRiskScore ?? 0}/100`} />
                <Metric label="Rating" value={top?.riskRating ?? 'N/A'} />
                <Metric label="YTM" value={`${top?.ytmPct ?? 0}%`} />
              </dl>
              <div className="mt-8 h-px bg-zinc-800" />
              <p className="mt-6 text-sm leading-relaxed text-zinc-300">
                {top?.covenantSummary ?? 'Covenant summary unavailable.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="monitoring" className="mx-auto max-w-[1120px] px-4 py-24">
        <div
          ref={monitoring.ref}
          className={`sticky top-20 grid gap-12 rounded-[44px] border border-zinc-200 bg-zinc-50 p-10 reveal ${monitoring.visible ? 'is-visible' : ''} lg:grid-cols-[1.1fr,1fr]`}
        >
          <div>
            <p className="text-sm text-zinc-500">Portfolio monitoring</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
              Understand concentration before it becomes risk.
            </h2>
            <p className="mt-5 max-w-xl text-zinc-600">
              Exposure mix, rating concentration, watchlist state, and maturity heat are continuously aligned to
              your investment committee lens.
            </p>
            <Link
              to="/portfolio"
              className="mt-7 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Open portfolio monitoring
            </Link>
          </div>
          <div className="grid gap-4">
            {sectorData.map((s) => (
              <div key={s.sector} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-zinc-600">{s.sector}</span>
                  <span className="font-medium text-zinc-900">{s.count} positions</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-zinc-900 transition-all duration-700"
                    style={{ width: `${Math.min(100, s.count * 26)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ai" className="border-y border-zinc-200 bg-white py-24">
        <div ref={ai.ref} className={`mx-auto max-w-[1120px] px-4 text-center reveal ${ai.visible ? 'is-visible' : ''}`}>
          <p className="text-sm text-zinc-500">AI research assistant</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
            Explain metrics.
            <br />
            Draft risk language.
            <br />
            Move faster.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-zinc-600">
            Use deterministic mode by default or connect OpenAI for richer analyst support while preserving
            structured outputs.
          </p>
          <Link
            to="/ai"
            className="mt-8 inline-block rounded-full bg-[#0071e3] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0061c4]"
          >
            Try AI assist
          </Link>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h3>
      <p className="mt-3 leading-relaxed text-zinc-600">{body}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-1 text-lg font-medium text-white">{value}</dd>
    </div>
  );
}
