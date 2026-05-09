import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MemoPreviewResponse, OpportunityListItem } from '@creditkit/types';

const SECTION_ORDER = [
  'Executive Summary',
  'Business Overview',
  'Investment Thesis',
  'Key Risks',
  'Financial Analysis',
  'Covenant Analysis',
  'Relative Value',
  'Recommendation',
];

function replaceAll(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

function buildVars(
  o: OpportunityListItem,
  analystNotes: string | undefined,
  recommendation: string | undefined,
): Record<string, string> {
  const rec = recommendation ?? 'hold';
  const fin = o.corporate
    ? [
        `- EBITDA (TTM): $${o.corporate.ebitdaTtm.toFixed(1)}m`,
        `- Revenue (TTM): $${o.corporate.revenueTtm.toFixed(1)}m`,
        `- Total debt: $${o.corporate.totalDebt.toFixed(1)}m; Cash: $${o.corporate.cash.toFixed(1)}m`,
        `- Interest expense (TTM): $${o.corporate.interestExpenseTtm.toFixed(1)}m`,
        `- FCF (TTM): $${o.corporate.fcfTtm.toFixed(1)}m`,
      ].join('\n')
    : o.infrastructure
      ? [
          `- PPA years remaining: ${o.infrastructure.ppaYearsRemaining}`,
          `- Contracted revenue: ${o.infrastructure.contractedRevenuePct}%`,
          `- Regulatory risk score: ${o.infrastructure.regulatoryRiskScore}/100`,
          `- Inflation-linked revenue: ${o.infrastructure.inflationLinkedRevenuePct}%`,
        ].join('\n')
      : '—';

  return {
    id: o.id,
    name: o.name,
    type: o.type,
    sector: o.sector,
    riskRating: o.riskRating,
    covenantSummary: o.covenantSummary,
    yieldSpreadBps: String(o.yieldSpreadBps),
    ytmPct: String(o.ytmPct),
    internalRiskScore: String(o.internalRiskScore),
    executiveSummary: `Structured credit opportunity in **${o.sector}** with ${o.riskRating} risk profile and ${o.yieldSpreadBps} bps spread.`,
    businessOverview:
      o.type === 'corporate'
        ? `${o.name} operates in ${o.industry ?? o.sector}. Review leverage path, cash conversion, and cyclicality versus peers.`
        : `${o.name} is an infrastructure asset with long-dated contracted cash flows; focus on offtake, O&M, and refinancing risk.`,
    keyRisks:
      o.watchlist
        ? '- **Watchlist:** elevated monitoring — liquidity and covenant headroom under stress.\n- Sector and macro sensitivity.\n- Refinancing / extension risk.'
        : '- Sector and macro sensitivity.\n- Covenant headroom under downside cases.\n- Counterparty / offtake concentration.',
    financialAnalysis: fin,
    covenantAnalysis: o.covenantSummary,
    relativeValue: `Compare spread vs ${o.sector} comps and recovery given subordination / collateral (${o.ltvPct != null ? `LTV ~${o.ltvPct}%` : 'unsecured / enterprise value'}).`,
    recommendation: rec.toUpperCase(),
    analystNotes: analystNotes?.trim() ? `**Analyst notes:**\n\n${analystNotes}` : '_No additional analyst notes._',
  };
}

export function renderInvestmentMemo(
  o: OpportunityListItem,
  analystNotes?: string,
  recommendation?: 'approve' | 'hold' | 'pass',
): MemoPreviewResponse {
  const path = resolve(process.cwd(), '../memos/templates/investment-memo.md');
  const template = readFileSync(path, 'utf-8');
  const rec = recommendation ?? 'hold';
  const vars = buildVars(o, analystNotes, rec);
  const markdown = replaceAll(template, vars);
  return { markdown, sections: SECTION_ORDER };
}
