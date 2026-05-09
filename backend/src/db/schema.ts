import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const opportunities = sqliteTable('opportunities', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['corporate', 'infrastructure'] }).notNull(),
  name: text('name').notNull(),
  sector: text('sector').notNull(),
  riskRating: text('risk_rating').notNull(),
  watchlist: integer('watchlist', { mode: 'boolean' }).notNull().default(false),
  /** JSON string — unified with PostgreSQL JSONB string transport */
  payload: text('payload').notNull(),
});

export const positions = sqliteTable('positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  opportunityId: text('opportunity_id').notNull(),
  weight: real('weight').notNull(),
  notional: real('notional').notNull(),
});
