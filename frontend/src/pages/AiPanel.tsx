import { useState } from 'react';
import type { AiAssistRequest } from '@creditkit/types';
import { api } from '../api.js';

export function AiPanel() {
  const [intent, setIntent] = useState<AiAssistRequest['intent']>('explain_metric');
  const [opportunityId, setOpportunityId] = useState('corp-aurora-mfg');
  const [metricKey, setMetricKey] = useState('debtToEbitda');
  const [out, setOut] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setOut(null);
    try {
      const body: AiAssistRequest = {
        intent,
        opportunityId: ['draft_risks', 'executive_summary'].includes(intent) ? opportunityId : undefined,
        metricKey: intent === 'explain_metric' ? metricKey : undefined,
        context: intent === 'compare' ? 'Compare two seed credits for relative value.' : undefined,
        compareOpportunityIds:
          intent === 'compare' ? ['corp-aurora-mfg', 'infra-solstice-wind'] : undefined,
      };
      const r = await api.aiAssist(body);
      setOut(r.text);
      setModel(r.model);
    } catch (e) {
      setOut((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">AI research assistant</h1>
        <p className="mt-2 text-ink-500">
          Explanations and draft bullets — uses OpenAI when <code className="text-accent">OPENAI_API_KEY</code> is
          set on the API; otherwise deterministic stubs.
        </p>
      </div>

      <div className="rounded-xl border border-ink-700 bg-ink-900 p-5 space-y-4">
        <label className="block text-sm">
          <span className="text-ink-500">Intent</span>
          <select
            className="mt-1 w-full rounded-md bg-ink-950 border border-ink-700 p-2 text-mist"
            value={intent}
            onChange={(e) => setIntent(e.target.value as AiAssistRequest['intent'])}
          >
            <option value="explain_metric">Explain metric</option>
            <option value="draft_risks">Draft key risks</option>
            <option value="compare">Compare opportunities</option>
            <option value="executive_summary">Executive summary</option>
          </select>
        </label>

        {intent === 'explain_metric' && (
          <label className="block text-sm">
            <span className="text-ink-500">Metric key</span>
            <input
              className="mt-1 w-full rounded-md bg-ink-950 border border-ink-700 p-2 text-mist"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
            />
          </label>
        )}

        {['draft_risks', 'executive_summary'].includes(intent) && (
          <label className="block text-sm">
            <span className="text-ink-500">Opportunity id</span>
            <input
              className="mt-1 w-full rounded-md bg-ink-950 border border-ink-700 p-2 text-mist"
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
            />
          </label>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={run}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run assist'}
        </button>
      </div>

      {model && <p className="text-xs text-ink-500">Model: {model}</p>}
      {out && (
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5 text-sm text-mist whitespace-pre-wrap">
          {out}
        </div>
      )}
    </div>
  );
}
