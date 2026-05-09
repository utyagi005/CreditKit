/** Shared API contract — v0 */

export type OpportunityType = 'corporate' | 'infrastructure';

export interface CorporateFinancials {
  ebitdaTtm: number;
  revenueTtm: number;
  totalDebt: number;
  cash: number;
  interestExpenseTtm: number;
  capexTtm: number;
  fcfTtm: number;
  debtMaturityProfileYears: number[];
}

export interface InfrastructureProject {
  ppaYearsRemaining: number;
  contractedRevenuePct: number;
  regulatoryRiskScore: number;
  inflationLinkedRevenuePct: number;
  projectLifeYears: number;
}

export interface OpportunityBase {
  id: string;
  type: OpportunityType;
  name: string;
  sector: string;
  industry?: string;
  riskRating: string;
  internalRiskScore: number;
  yieldSpreadBps: number;
  ytmPct: number;
  ltvPct?: number;
  covenantSummary: string;
  watchlist: boolean;
  corporate?: CorporateFinancials;
  infrastructure?: InfrastructureProject;
}

export interface ComputedMetrics {
  debtToEbitda: number | null;
  interestCoverage: number | null;
  probabilityOfDefaultPct: number;
  recoveryRatePct: number;
  dscr?: number;
}

export interface OpportunityListItem extends OpportunityBase {
  computed?: ComputedMetrics;
}

export interface OpportunityDetail extends OpportunityListItem {
  computed: ComputedMetrics;
  analyticsSource: 'python' | 'local';
}

export interface PortfolioSummary {
  totalNotional: number;
  bySector: { sector: string; notional: number; pct: number }[];
  byRiskRating: { rating: string; count: number }[];
  watchlistCount: number;
  upcomingMaturities: { opportunityId: string; name: string; years: number }[];
  concentrationTopIssuerPct: number;
}

export interface MemoPreviewRequest {
  opportunityId: string;
  analystNotes?: string;
  recommendation?: 'approve' | 'hold' | 'pass';
}

export interface MemoPreviewResponse {
  markdown: string;
  sections: string[];
}

export interface AnalyticsInputCorporate {
  kind: 'corporate';
  ebitdaTtm: number;
  totalDebt: number;
  interestExpenseTtm: number;
  cash: number;
  revenueTtm: number;
}

export interface AnalyticsInputInfrastructure {
  kind: 'infrastructure';
  noiTtm: number;
  debtServiceTtm: number;
  cash: number;
}

export type AnalyticsInput = AnalyticsInputCorporate | AnalyticsInputInfrastructure;

export interface AnalyticsMetricsResponse {
  debtToEbitda: number | null;
  interestCoverage: number | null;
  dscr: number | null;
  probabilityOfDefaultPct: number;
  recoveryRatePct: number;
}

export type AiAssistIntent =
  | 'explain_metric'
  | 'draft_risks'
  | 'compare'
  | 'executive_summary';

export interface AiAssistRequest {
  intent: AiAssistIntent;
  opportunityId?: string;
  compareOpportunityIds?: [string, string];
  metricKey?: string;
  context?: string;
}

export interface AiAssistResponse {
  text: string;
  model: 'stub' | 'openai';
}

export interface HealthResponse {
  status: 'ok';
  database: 'connected' | 'error';
  analyticsReachable: boolean;
}
