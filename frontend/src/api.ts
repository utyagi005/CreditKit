import type {
  AiAssistRequest,
  AiAssistResponse,
  MemoPreviewResponse,
  OpportunityDetail,
  OpportunityListItem,
  PortfolioSummary,
} from '@creditkit/types';

const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  opportunities: () => json<OpportunityListItem[]>('/api/opportunities'),
  opportunity: (id: string) => json<OpportunityDetail>(`/api/opportunities/${id}`),
  portfolioSummary: () => json<PortfolioSummary>('/api/portfolio/summary'),
  memoPreview: (body: { opportunityId: string; analystNotes?: string; recommendation?: string }) =>
    json<MemoPreviewResponse>('/api/memos/preview', { method: 'POST', body: JSON.stringify(body) }),
  aiAssist: (body: AiAssistRequest) =>
    json<AiAssistResponse>('/api/ai/assist', { method: 'POST', body: JSON.stringify(body) }),
};
