import { describe, expect, it } from 'vitest';
import type { OpportunityType } from './index.js';

describe('types', () => {
  it('OpportunityType is narrowable', () => {
    const t: OpportunityType = 'corporate';
    expect(t).toBe('corporate');
  });
});
