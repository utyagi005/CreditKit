import type { AiAssistRequest, AiAssistResponse, OpportunityListItem } from '@creditkit/types';
import OpenAI from 'openai';
import { loadConfig } from '../config.js';

function stubResponse(req: AiAssistRequest, opp?: OpportunityListItem | null): AiAssistResponse {
  if (req.intent === 'explain_metric' && req.metricKey) {
    const glossary: Record<string, string> = {
      debtToEbitda:
        'Net debt divided by EBITDA — higher values imply more leverage and typically higher credit risk.',
      interestCoverage:
        'EBITDA (or EBIT) divided by cash interest expense — measures ability to service debt from operations.',
      dscr:
        'Debt service coverage ratio — NOI (or CFADS) divided by required principal and interest; common in project finance.',
      ltv: 'Loan-to-value — debt as a percentage of appraised or enterprise value / asset value.',
    };
    const text = glossary[req.metricKey] ?? `**${req.metricKey}** is a standard credit metric; see IC memo financial section for context.`;
    return { text, model: 'stub' };
  }
  if (req.intent === 'draft_risks' && opp) {
    return {
      text: [
        `- **Business risk:** demand and margin volatility in ${opp.sector}.`,
        `- **Financial risk:** leverage and liquidity under a downside EBITDA scenario.`,
        `- **Structure:** ${opp.covenantSummary}`,
      ].join('\n'),
      model: 'stub',
    };
  }
  if (req.intent === 'compare' && req.context) {
    return {
      text: `Comparison (stub): prioritize the opportunity with stronger cash flow coverage, better covenant headroom, and higher recovery prospects. Context: ${req.context}`,
      model: 'stub',
    };
  }
  if (req.intent === 'executive_summary' && opp) {
    return {
      text: `${opp.name} (${opp.type}) in ${opp.sector} — ${opp.riskRating} risk, ${opp.yieldSpreadBps} bps spread. ${opp.watchlist ? 'On watchlist for closer monitoring.' : 'Standard monitoring.'}`,
      model: 'stub',
    };
  }
  return {
    text: 'CreditKit AI assist is running in stub mode. Set OPENAI_API_KEY for richer responses.',
    model: 'stub',
  };
}

export async function runAiAssist(
  req: AiAssistRequest,
  getOpportunity: (id: string) => Promise<OpportunityListItem | null>,
): Promise<AiAssistResponse> {
  const cfg = loadConfig();
  const opp = req.opportunityId ? await getOpportunity(req.opportunityId) : null;
  if (!cfg.OPENAI_API_KEY) {
    return stubResponse(req, opp);
  }

  const client = new OpenAI({ apiKey: cfg.OPENAI_API_KEY });
  const system = `You are a senior private credit analyst. Be concise, institutional tone, no fabricated numbers. If data is missing, say what is missing. Max 180 words.`;

  let user = '';
  switch (req.intent) {
    case 'explain_metric':
      user = `Explain credit metric "${req.metricKey ?? 'n/a'}" for practitioners.`;
      break;
    case 'draft_risks':
      user = opp
        ? `Draft 4 bullet key risks for:\n${JSON.stringify({ name: opp.name, sector: opp.sector, type: opp.type, covenantSummary: opp.covenantSummary })}`
        : 'Draft generic private credit key risks.';
      break;
    case 'compare':
      user = `Compare opportunities briefly. Context: ${req.context ?? ''}`;
      break;
    case 'executive_summary':
      user = opp
        ? `Executive summary (3 sentences) for IC:\n${JSON.stringify({ name: opp.name, sector: opp.sector, riskRating: opp.riskRating, spreadBps: opp.yieldSpreadBps })}`
        : 'Executive summary unavailable — no opportunity id.';
      break;
    default:
      user = req.context ?? 'Assist the analyst.';
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 400,
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? '';
    return { text: text || stubResponse(req, opp).text, model: 'openai' };
  } catch {
    return stubResponse(req, opp);
  }
}
