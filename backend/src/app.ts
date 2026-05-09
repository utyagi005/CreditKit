import type {
  AiAssistRequest,
  AnalyticsInput,
  HealthResponse,
  MemoPreviewRequest,
} from '@creditkit/types';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { loadConfig } from './config.js';
import { getDb } from './db/driver.js';
import { analyticsReachable } from './services/analyticsClient.js';
import { runAiAssist } from './services/aiAssist.js';
import { renderInvestmentMemo } from './services/memoRenderer.js';
import { computeForOpportunity } from './services/metrics.js';

const memoBodySchema = z.object({
  opportunityId: z.string(),
  analystNotes: z.string().optional(),
  recommendation: z.enum(['approve', 'hold', 'pass']).optional(),
});

const analyticsBodySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('corporate'),
    ebitdaTtm: z.number(),
    totalDebt: z.number(),
    interestExpenseTtm: z.number(),
    cash: z.number(),
    revenueTtm: z.number(),
  }),
  z.object({
    kind: z.literal('infrastructure'),
    noiTtm: z.number(),
    debtServiceTtm: z.number(),
    cash: z.number(),
  }),
]);

const aiBodySchema = z.object({
  intent: z.enum(['explain_metric', 'draft_risks', 'compare', 'executive_summary']),
  opportunityId: z.string().optional(),
  compareOpportunityIds: z.tuple([z.string(), z.string()]).optional(),
  metricKey: z.string().optional(),
  context: z.string().optional(),
});

export function createApp() {
  const cfg = loadConfig();
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: cfg.CORS_ORIGIN.split(',').map((s) => s.trim()),
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 200,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', async (_req, res) => {
    let database: HealthResponse['database'] = 'error';
    try {
      await getDb().listOpportunities();
      database = 'connected';
    } catch {
      database = 'error';
    }
    const body: HealthResponse = {
      status: 'ok',
      database,
      analyticsReachable: await analyticsReachable(),
    };
    res.json(body);
  });

  app.get('/api/opportunities', async (_req, res) => {
    const rows = await getDb().listOpportunities();
    const withMetrics = await Promise.all(
      rows.map(async (o) => {
        const { computed } = await computeForOpportunity(o);
        return { ...o, computed };
      }),
    );
    res.json(withMetrics);
  });

  app.get('/api/opportunities/:id', async (req, res) => {
    const o = await getDb().getOpportunity(req.params.id);
    if (!o) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const { computed, source } = await computeForOpportunity(o);
    res.json({
      ...o,
      computed,
      analyticsSource: source,
    });
  });

  app.get('/api/portfolio/summary', async (_req, res) => {
    const summary = await getDb().portfolioSummary();
    res.json(summary);
  });

  app.post('/api/memos/preview', async (req, res) => {
    const parsed = memoBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const body = parsed.data as MemoPreviewRequest;
    const o = await getDb().getOpportunity(body.opportunityId);
    if (!o) {
      res.status(404).json({ error: 'Opportunity not found' });
      return;
    }
    const memo = renderInvestmentMemo(o, body.analystNotes, body.recommendation);
    res.json(memo);
  });

  app.post('/api/analytics/metrics', async (req, res) => {
    const parsed = analyticsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { fetchAnalyticsMetrics } = await import('./services/analyticsClient.js');
    const input = parsed.data as AnalyticsInput;
    const m = await fetchAnalyticsMetrics(input);
    if (!m) {
      res.status(502).json({ error: 'Analytics service unavailable' });
      return;
    }
    res.json(m);
  });

  app.post('/api/ai/assist', async (req, res) => {
    const parsed = aiBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const body = parsed.data as AiAssistRequest;
    let context = body.context;
    if (body.intent === 'compare' && body.compareOpportunityIds) {
      const [a, b] = body.compareOpportunityIds;
      const oa = await getDb().getOpportunity(a);
      const ob = await getDb().getOpportunity(b);
      context = JSON.stringify({
        a: oa ? { id: oa.id, name: oa.name, sector: oa.sector, rating: oa.riskRating } : null,
        b: ob ? { id: ob.id, name: ob.name, sector: ob.sector, rating: ob.riskRating } : null,
      });
    }
    const out = await runAiAssist({ ...body, context }, (id) => getDb().getOpportunity(id));
    res.json(out);
  });

  return app;
}
