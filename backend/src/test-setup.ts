import { execFileSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll } from 'vitest';
import { resetDbSingleton } from './db/driver.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dbFile = join(root, 'vitest.db');

process.env.DATABASE_URL = `file:${dbFile}`;
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.ANALYTICS_URL = 'http://127.0.0.1:59999';

beforeAll(() => {
  if (existsSync(dbFile)) unlinkSync(dbFile);
  resetDbSingleton();
  execFileSync('pnpm', ['exec', 'tsx', 'src/db/migrate.ts'], { cwd: root, stdio: 'inherit', env: process.env });
  execFileSync('pnpm', ['exec', 'tsx', 'src/db/seed.ts'], { cwd: root, stdio: 'inherit', env: process.env });
  resetDbSingleton();
});

afterAll(() => {
  resetDbSingleton();
  if (existsSync(dbFile)) unlinkSync(dbFile);
});
