import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { OpportunityListItem, PortfolioSummary } from '@creditkit/types';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import pg from 'pg';
import { isPostgresUrl, loadConfig } from '../config.js';
import * as schema from './schema.js';

export type SeedFile = {
  opportunities: OpportunityListItem[];
  positions: { opportunityId: string; weight: number; notional: number }[];
};

function resolveSqliteFilePath(url: string): string {
  let filePath = url.replace(/^file:/, '');
  if (!filePath.startsWith('/')) {
    filePath = resolve(process.cwd(), filePath);
  }
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return filePath;
}

function rowToOpportunity(row: {
  id: string;
  type: 'corporate' | 'infrastructure';
  name: string;
  sector: string;
  risk_rating: string;
  watchlist: boolean;
  payload: string | OpportunityListItem | Record<string, unknown>;
}): OpportunityListItem {
  const parsed =
    typeof row.payload === 'string'
      ? (JSON.parse(row.payload) as OpportunityListItem)
      : (row.payload as OpportunityListItem);
  return {
    ...parsed,
    id: row.id,
    type: row.type,
    name: row.name,
    sector: row.sector,
    riskRating: row.risk_rating,
    watchlist: row.watchlist,
  };
}

export interface CreditKitDb {
  listOpportunities(): Promise<OpportunityListItem[]>;
  getOpportunity(id: string): Promise<OpportunityListItem | null>;
  portfolioSummary(): Promise<PortfolioSummary>;
}

class SqliteDb implements CreditKitDb {
  private readonly _db: ReturnType<typeof drizzleSqlite>;

  constructor(url: string) {
    const path = resolveSqliteFilePath(url);
    const raw = new Database(path);
    this._db = drizzleSqlite(raw, { schema });
  }

  get drizzle() {
    return this._db;
  }

  async listOpportunities(): Promise<OpportunityListItem[]> {
    const rows = this._db.select().from(schema.opportunities).all();
    return rows.map((r) =>
      rowToOpportunity({
        id: r.id,
        type: r.type,
        name: r.name,
        sector: r.sector,
        risk_rating: r.riskRating,
        watchlist: r.watchlist,
        payload: r.payload,
      }),
    );
  }

  async getOpportunity(id: string): Promise<OpportunityListItem | null> {
    const rows = this._db.select().from(schema.opportunities).where(eq(schema.opportunities.id, id)).all();
    const r = rows[0];
    if (!r) return null;
    return rowToOpportunity({
      id: r.id,
      type: r.type,
      name: r.name,
      sector: r.sector,
      risk_rating: r.riskRating,
      watchlist: r.watchlist,
      payload: r.payload,
    });
  }

  async portfolioSummary(): Promise<PortfolioSummary> {
    const opps = await this.listOpportunities();
    const posRows = this._db.select().from(schema.positions).all();
    const oppMap = new Map(opps.map((o) => [o.id, o]));
    let totalNotional = 0;
    const sectorMap = new Map<string, number>();
    const ratingMap = new Map<string, number>();
    let watchlistCount = 0;
    const maturities: { opportunityId: string; name: string; years: number }[] = [];

    for (const o of opps) {
      if (o.watchlist) watchlistCount += 1;
      ratingMap.set(o.riskRating, (ratingMap.get(o.riskRating) ?? 0) + 1);
      const years =
        o.type === 'corporate'
          ? Math.min(...(o.corporate?.debtMaturityProfileYears ?? [5]))
          : (o.infrastructure?.ppaYearsRemaining ?? 10);
      maturities.push({ opportunityId: o.id, name: o.name, years });
    }

    for (const p of posRows) {
      totalNotional += p.notional;
      const o = oppMap.get(p.opportunityId);
      if (!o) continue;
      sectorMap.set(o.sector, (sectorMap.get(o.sector) ?? 0) + p.notional);
    }

    const bySector = [...sectorMap.entries()].map(([sector, notional]) => ({
      sector,
      notional,
      pct: totalNotional > 0 ? Math.round((notional / totalNotional) * 1000) / 10 : 0,
    }));

    const byRiskRating = [...ratingMap.entries()].map(([rating, count]) => ({ rating, count }));

    const sorted = [...posRows].sort((a, b) => b.notional - a.notional);
    const top = sorted[0];
    const concentrationTopIssuerPct =
      top && totalNotional > 0 ? Math.round((top.notional / totalNotional) * 1000) / 10 : 0;

    return {
      totalNotional,
      bySector,
      byRiskRating,
      watchlistCount,
      upcomingMaturities: maturities.sort((a, b) => a.years - b.years).slice(0, 5),
      concentrationTopIssuerPct,
    };
  }
}

class PgDb implements CreditKitDb {
  private readonly pool: pg.Pool;

  constructor(url: string) {
    this.pool = new pg.Pool({ connectionString: url });
  }

  get clientPool() {
    return this.pool;
  }

  async listOpportunities(): Promise<OpportunityListItem[]> {
    const res = await this.pool.query<{
      id: string;
      type: 'corporate' | 'infrastructure';
      name: string;
      sector: string;
      risk_rating: string;
      watchlist: boolean;
      payload: OpportunityListItem;
    }>('SELECT id, type, name, sector, risk_rating, watchlist, payload FROM opportunities ORDER BY name');
    return res.rows.map((r) =>
      rowToOpportunity({
        id: r.id,
        type: r.type,
        name: r.name,
        sector: r.sector,
        risk_rating: r.risk_rating,
        watchlist: r.watchlist,
        payload: r.payload,
      }),
    );
  }

  async getOpportunity(id: string): Promise<OpportunityListItem | null> {
    const res = await this.pool.query<{
      id: string;
      type: 'corporate' | 'infrastructure';
      name: string;
      sector: string;
      risk_rating: string;
      watchlist: boolean;
      payload: OpportunityListItem;
    }>('SELECT id, type, name, sector, risk_rating, watchlist, payload FROM opportunities WHERE id = $1', [id]);
    const r = res.rows[0];
    if (!r) return null;
    return rowToOpportunity({
      id: r.id,
      type: r.type,
      name: r.name,
      sector: r.sector,
      risk_rating: r.risk_rating,
      watchlist: r.watchlist,
      payload: r.payload,
    });
  }

  async portfolioSummary(): Promise<PortfolioSummary> {
    const opps = await this.listOpportunities();
    const res = await this.pool.query<{ opportunity_id: string; notional: number; weight: number }>(
      'SELECT opportunity_id, notional, weight FROM positions',
    );
    const oppMap = new Map(opps.map((o) => [o.id, o]));
    let totalNotional = 0;
    const sectorMap = new Map<string, number>();
    const ratingMap = new Map<string, number>();
    let watchlistCount = 0;
    const maturities: { opportunityId: string; name: string; years: number }[] = [];

    for (const o of opps) {
      if (o.watchlist) watchlistCount += 1;
      ratingMap.set(o.riskRating, (ratingMap.get(o.riskRating) ?? 0) + 1);
      const years =
        o.type === 'corporate'
          ? Math.min(...(o.corporate?.debtMaturityProfileYears ?? [5]))
          : (o.infrastructure?.ppaYearsRemaining ?? 10);
      maturities.push({ opportunityId: o.id, name: o.name, years });
    }

    for (const p of res.rows) {
      totalNotional += Number(p.notional);
      const o = oppMap.get(p.opportunity_id);
      if (!o) continue;
      sectorMap.set(o.sector, (sectorMap.get(o.sector) ?? 0) + Number(p.notional));
    }

    const bySector = [...sectorMap.entries()].map(([sector, notional]) => ({
      sector,
      notional,
      pct: totalNotional > 0 ? Math.round((notional / totalNotional) * 1000) / 10 : 0,
    }));

    const byRiskRating = [...ratingMap.entries()].map(([rating, count]) => ({ rating, count }));

    const sorted = [...res.rows].sort((a, b) => Number(b.notional) - Number(a.notional));
    const top = sorted[0];
    const concentrationTopIssuerPct =
      top && totalNotional > 0 ? Math.round((Number(top.notional) / totalNotional) * 1000) / 10 : 0;

    return {
      totalNotional,
      bySector,
      byRiskRating,
      watchlistCount,
      upcomingMaturities: maturities.sort((a, b) => a.years - b.years).slice(0, 5),
      concentrationTopIssuerPct,
    };
  }
}

let singleton: CreditKitDb | null = null;

/** Test helper — clears cached DB connection */
export function resetDbSingleton(): void {
  singleton = null;
}

export function getDb(): CreditKitDb {
  if (singleton) return singleton;
  const { DATABASE_URL } = loadConfig();
  singleton = isPostgresUrl(DATABASE_URL) ? new PgDb(DATABASE_URL) : new SqliteDb(DATABASE_URL);
  return singleton;
}

export function getSqliteDb(): SqliteDb | null {
  const { DATABASE_URL } = loadConfig();
  return isPostgresUrl(DATABASE_URL) ? null : (getDb() as SqliteDb);
}

export function getPgPool(): pg.Pool | null {
  const { DATABASE_URL } = loadConfig();
  return isPostgresUrl(DATABASE_URL) ? (getDb() as PgDb).clientPool : null;
}

export function loadSeedJson(): SeedFile {
  const path = resolve(process.cwd(), '../data/seed.json');
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw) as SeedFile;
}
