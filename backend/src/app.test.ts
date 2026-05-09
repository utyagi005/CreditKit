import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('API', () => {
  const app = createApp();

  it('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('GET /api/opportunities', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('computed');
  });

  it('GET /api/portfolio/summary', async () => {
    const res = await request(app).get('/api/portfolio/summary');
    expect(res.status).toBe(200);
    expect(res.body.totalNotional).toBeGreaterThan(0);
  });

  it('POST /api/memos/preview', async () => {
    const res = await request(app)
      .post('/api/memos/preview')
      .send({ opportunityId: 'corp-aurora-mfg', recommendation: 'hold' });
    expect(res.status).toBe(200);
    expect(res.body.markdown).toContain('Aurora');
  });

  it('POST /api/ai/assist stub', async () => {
    const res = await request(app)
      .post('/api/ai/assist')
      .send({ intent: 'explain_metric', metricKey: 'dscr' });
    expect(res.status).toBe(200);
    expect(res.body.model).toBe('stub');
  });
});
