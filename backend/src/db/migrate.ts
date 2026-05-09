import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import pg from 'pg';
import { isPostgresUrl, loadConfig } from '../config.js';

const SQLITE_DDL = `
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  risk_rating TEXT NOT NULL,
  watchlist INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_id TEXT NOT NULL,
  weight REAL NOT NULL,
  notional REAL NOT NULL
);
`;

async function migratePostgres(url: string) {
  const pool = new pg.Pool({ connectionString: url });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      sector TEXT NOT NULL,
      risk_rating TEXT NOT NULL,
      watchlist BOOLEAN NOT NULL DEFAULT FALSE,
      payload JSONB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      opportunity_id TEXT NOT NULL,
      weight DOUBLE PRECISION NOT NULL,
      notional DOUBLE PRECISION NOT NULL
    );
  `);
  await pool.end();
}

function migrateSqlitePath(filePath: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const sqlite = new Database(filePath);
  sqlite.exec(SQLITE_DDL);
  sqlite.close();
}

async function main() {
  const { DATABASE_URL } = loadConfig();
  if (isPostgresUrl(DATABASE_URL)) {
    await migratePostgres(DATABASE_URL);
    console.log('PostgreSQL migrations applied.');
    return;
  }

  let filePath = DATABASE_URL.replace(/^file:/, '');
  if (!filePath.startsWith('/')) {
    filePath = resolve(process.cwd(), filePath);
  }
  migrateSqlitePath(filePath);
  console.log('SQLite migrations applied.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
