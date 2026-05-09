import { loadConfig } from '../config.js';
import { getPgPool, getSqliteDb, loadSeedJson } from './driver.js';
import { opportunities as opportunitiesTable, positions as positionsTable } from './schema.js';

async function main() {
  loadConfig();
  const seed = loadSeedJson();

  const pgPool = getPgPool();
  if (pgPool) {
    await pgPool.query('DELETE FROM positions');
    await pgPool.query('DELETE FROM opportunities');
    for (const o of seed.opportunities) {
      await pgPool.query(
        `INSERT INTO opportunities (id, type, name, sector, risk_rating, watchlist, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [o.id, o.type, o.name, o.sector, o.riskRating, o.watchlist, JSON.stringify(o)],
      );
    }
    for (const p of seed.positions) {
      await pgPool.query(
        `INSERT INTO positions (opportunity_id, weight, notional) VALUES ($1, $2, $3)`,
        [p.opportunityId, p.weight, p.notional],
      );
    }
    await pgPool.end();
    console.log('PostgreSQL seeded.');
    return;
  }

  const sqlite = getSqliteDb();
  if (!sqlite) throw new Error('Expected SQLite database');
  const db = sqlite.drizzle;
  db.delete(positionsTable).run();
  db.delete(opportunitiesTable).run();
  for (const o of seed.opportunities) {
    db.insert(opportunitiesTable)
      .values({
        id: o.id,
        type: o.type,
        name: o.name,
        sector: o.sector,
        riskRating: o.riskRating,
        watchlist: o.watchlist,
        payload: JSON.stringify(o),
      })
      .run();
  }
  for (const p of seed.positions) {
    db.insert(positionsTable)
      .values({
        opportunityId: p.opportunityId,
        weight: p.weight,
        notional: p.notional,
      })
      .run();
  }
  console.log('SQLite seeded.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
