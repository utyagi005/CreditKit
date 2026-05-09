import type { AnalyticsInput, ComputedMetrics, OpportunityListItem } from '@creditkit/types';
import { fetchAnalyticsMetrics } from './analyticsClient.js';

function localMetrics(o: OpportunityListItem): ComputedMetrics {
  if (o.type === 'corporate' && o.corporate) {
    const { ebitdaTtm, totalDebt, interestExpenseTtm } = o.corporate;
    const debtToEbitda = ebitdaTtm > 0 ? totalDebt / ebitdaTtm : null;
    const interestCoverage =
      interestExpenseTtm > 0 ? (ebitdaTtm * 0.85) / interestExpenseTtm : null;
    return {
      debtToEbitda,
      interestCoverage,
      probabilityOfDefaultPct: Math.min(99, Math.max(1, o.internalRiskScore * 0.45)),
      recoveryRatePct: Math.max(25, 100 - o.internalRiskScore * 0.35),
    };
  }
  if (o.type === 'infrastructure' && o.infrastructure) {
    const noi = o.ytmPct * 2.1;
    const ds = o.ytmPct * 1.05;
    const dscr = ds > 0 ? noi / ds : 1.2;
    return {
      debtToEbitda: null,
      interestCoverage: null,
      dscr: Math.round(dscr * 100) / 100,
      probabilityOfDefaultPct: Math.min(40, o.infrastructure.regulatoryRiskScore * 0.5),
      recoveryRatePct: 55,
    };
  }
  return {
    debtToEbitda: null,
    interestCoverage: null,
    probabilityOfDefaultPct: 10,
    recoveryRatePct: 50,
  };
}

function toAnalyticsInput(o: OpportunityListItem): AnalyticsInput | null {
  if (o.type === 'corporate' && o.corporate) {
    return {
      kind: 'corporate',
      ebitdaTtm: o.corporate.ebitdaTtm,
      totalDebt: o.corporate.totalDebt,
      interestExpenseTtm: o.corporate.interestExpenseTtm,
      cash: o.corporate.cash,
      revenueTtm: o.corporate.revenueTtm,
    };
  }
  if (o.type === 'infrastructure') {
    const noiTtm = o.ytmPct * 2.1 * 5;
    const debtServiceTtm = o.ytmPct * 1.05 * 5;
    return {
      kind: 'infrastructure',
      noiTtm,
      debtServiceTtm,
      cash: 5,
    };
  }
  return null;
}

export async function computeForOpportunity(o: OpportunityListItem): Promise<{
  computed: ComputedMetrics;
  source: 'python' | 'local';
}> {
  const input = toAnalyticsInput(o);
  if (input) {
    const remote = await fetchAnalyticsMetrics(input);
    if (remote) {
      return {
        computed: {
          debtToEbitda: remote.debtToEbitda,
          interestCoverage: remote.interestCoverage,
          dscr: remote.dscr ?? undefined,
          probabilityOfDefaultPct: remote.probabilityOfDefaultPct,
          recoveryRatePct: remote.recoveryRatePct,
        },
        source: 'python',
      };
    }
  }
  return { computed: localMetrics(o), source: 'local' };
}
