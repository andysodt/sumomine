import { pgTable, text, integer, decimal, timestamp, boolean, varchar, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Rikishi table
export const rikishi = pgTable('rikishi', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  shikonaEn: text('shikona_en'),
  shikonaJp: text('shikona_jp'),
  rank: text('rank').notNull(),
  stable: text('stable').notNull(),
  weight: integer('weight').default(0),
  height: integer('height').default(0),
  birthDate: text('birth_date'),
  debut: text('debut'),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  draws: integer('draws').default(0),
  sumodbId: integer('sumodb_id'),
  nskId: integer('nsk_id'),
  currentRank: text('current_rank'),
  heya: text('heya'),
  shusshin: text('shusshin'),
  updatedAt: text('updated_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Basho (tournaments) table
export const basho = pgTable('basho', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  division: text('division').notNull(),
  participants: jsonb('participants').default('[]'),
  bouts: jsonb('bouts').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Bouts table
export const bouts = pgTable('bouts', {
  id: text('id').primaryKey(),
  bashoId: text('basho_id').references(() => basho.id),
  rikishi1Id: text('rikishi1_id').references(() => rikishi.id),
  rikishi2Id: text('rikishi2_id').references(() => rikishi.id),
  winnerId: text('winner_id').references(() => rikishi.id),
  kimarite: text('kimarite'),
  date: text('date').notNull(),
  day: integer('day').notNull(),
  division: text('division'),
  matchNo: integer('match_no'),
  eastId: integer('east_id'),
  eastShikona: text('east_shikona'),
  eastRank: text('east_rank'),
  westId: integer('west_id'),
  westShikona: text('west_shikona'),
  westRank: text('west_rank'),
  winnerEn: text('winner_en'),
  winnerJp: text('winner_jp'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Kimarite (winning techniques) table
export const kimarite = pgTable('kimarite', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  category: text('category').default('Unknown'),
  description: text('description'),
  count: integer('count').default(0),
  lastUsed: text('last_used'),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  rarity: text('rarity'),
  effectiveness: text('effectiveness'),
  popularityTrend: text('popularity_trend'),
  lastUsedDaysAgo: integer('last_used_days_ago'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Measurements table
export const measurements = pgTable('measurements', {
  id: text('id').primaryKey(),
  bashoId: text('basho_id').notNull(),
  rikishiId: text('rikishi_id').references(() => rikishi.id),
  rikishiName: text('rikishi_name'),
  height: integer('height').notNull(),
  weight: integer('weight').notNull(),
  bmi: decimal('bmi', { precision: 4, scale: 1 }),
  bmiCategory: text('bmi_category'),
  heightPercentile: integer('height_percentile'),
  weightPercentile: integer('weight_percentile'),
  powerIndex: integer('power_index'),
  weightHeightRatio: decimal('weight_height_ratio', { precision: 4, scale: 2 }),
  year: integer('year'),
  month: integer('month'),
  seasonName: text('season_name'),
  comparisonToAverage: jsonb('comparison_to_average'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Ranks table
export const ranks = pgTable('ranks', {
  id: text('id').primaryKey(),
  bashoId: text('basho_id').notNull(),
  rikishiId: text('rikishi_id').references(() => rikishi.id),
  rikishiName: text('rikishi_name'),
  rank: text('rank').notNull(),
  division: text('division'),
  rankNumber: integer('rank_number'),
  side: text('side'),
  year: integer('year'),
  month: integer('month'),
  seasonName: text('season_name'),
  isPromotion: boolean('is_promotion'),
  isDemotion: boolean('is_demotion'),
  previousRank: text('previous_rank'),
  rankChange: text('rank_change'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Shikonas (ring names) table
export const shikonas = pgTable('shikonas', {
  id: text('id').primaryKey(),
  bashoId: text('basho_id').notNull(),
  rikishiId: text('rikishi_id').references(() => rikishi.id),
  rikishiName: text('rikishi_name'),
  shikona: text('shikona').notNull(),
  shikonaEn: text('shikona_en'),
  shikonaJp: text('shikona_jp'),
  year: integer('year'),
  month: integer('month'),
  seasonName: text('season_name'),
  isNewShikona: boolean('is_new_shikona'),
  previousShikona: text('previous_shikona'),
  shikonaHistory: jsonb('shikona_history').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Banzuke table
export const banzuke = pgTable('banzuke', {
  id: text('id').primaryKey(),
  bashoId: text('basho_id').notNull(),
  division: text('division').notNull(),
  rank: text('rank').notNull(),
  side: text('side').notNull(),
  rikishiId: text('rikishi_id').references(() => rikishi.id),
  rikishiName: text('rikishi_name'),
  stable: text('stable'),
  year: integer('year'),
  month: integer('month'),
  seasonName: text('season_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Torikumi (match schedule) table
export const torikumi = pgTable('torikumi', {
  id: text('id').primaryKey(),
  bashoId: text('basho_id').notNull(),
  division: text('division').notNull(),
  day: integer('day').notNull(),
  matchNo: integer('match_no').notNull(),
  eastId: integer('east_id'),
  eastShikona: text('east_shikona'),
  eastRank: text('east_rank'),
  westId: integer('west_id'),
  westShikona: text('west_shikona'),
  westRank: text('west_rank'),
  winnerId: integer('winner_id'),
  kimarite: text('kimarite'),
  winnerEn: text('winner_en'),
  winnerJp: text('winner_jp'),
  year: integer('year'),
  month: integer('month'),
  seasonName: text('season_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Zod schemas for validation
export const insertRikishiSchema = z.object({
  id: z.string(),
  name: z.string(),
  shikonaEn: z.string().optional(),
  shikonaJp: z.string().optional(),
  rank: z.string(),
  stable: z.string(),
  weight: z.number().default(0),
  height: z.number().default(0),
  birthDate: z.string().optional(),
  debut: z.string().optional(),
  wins: z.number().default(0),
  losses: z.number().default(0),
  draws: z.number().default(0),
  sumodbId: z.number().optional(),
  nskId: z.number().optional(),
  currentRank: z.string().optional(),
  heya: z.string().optional(),
  shusshin: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const selectRikishiSchema = insertRikishiSchema.extend({
  createdAt: z.date().optional(),
});

export const insertBashoSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  division: z.string(),
  participants: z.array(z.any()).default([]),
  bouts: z.array(z.any()).default([]),
});

export const selectBashoSchema = insertBashoSchema.extend({
  createdAt: z.date().optional(),
});

export const insertBoutSchema = z.object({
  id: z.string(),
  bashoId: z.string().optional(),
  rikishi1Id: z.string().optional(),
  rikishi2Id: z.string().optional(),
  winnerId: z.string().optional(),
  kimarite: z.string().optional(),
  date: z.string(),
  day: z.number(),
  division: z.string().optional(),
  matchNo: z.number().optional(),
  eastId: z.number().optional(),
  eastShikona: z.string().optional(),
  eastRank: z.string().optional(),
  westId: z.number().optional(),
  westShikona: z.string().optional(),
  westRank: z.string().optional(),
  winnerEn: z.string().optional(),
  winnerJp: z.string().optional(),
});

export const selectBoutSchema = insertBoutSchema.extend({
  createdAt: z.date().optional(),
});

export type Rikishi = z.infer<typeof selectRikishiSchema>;
export type NewRikishi = z.infer<typeof insertRikishiSchema>;
export type Basho = z.infer<typeof selectBashoSchema>;
export type NewBasho = z.infer<typeof insertBashoSchema>;
export type Bout = z.infer<typeof selectBoutSchema>;
export type NewBout = z.infer<typeof insertBoutSchema>;