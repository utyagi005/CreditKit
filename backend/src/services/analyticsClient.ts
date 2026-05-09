import type { AnalyticsInput, AnalyticsMetricsResponse } from '@creditkit/types';
import { loadConfig } from '../config.js';

export async function fetchAnalyticsMetrics(body: AnalyticsInput): Promise<AnalyticsMetricsResponse | null> {
  const { ANALYTICS_URL } = loadConfig();
  try {
    const res = await fetch(`${ANALYTICS_URL.replace(/\/$/, '')}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as AnalyticsMetricsResponse;
  } catch {
    return null;
  }
}

export async function analyticsReachable(): Promise<boolean> {
  const { ANALYTICS_URL } = loadConfig();
  try {
    const res = await fetch(`${ANALYTICS_URL.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}
