import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { boolean } from 'drizzle-orm/singlestore-core/columns/boolean';
import { sqliteTable, text, real, integer, unique } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
``

export interface tokenBlacklist {
  token: string;
  expiresAt: Date;
}
export interface User {
  id: string;
  email: string;
  balance: number;
  role: 'user' | 'admin' | 'moderator';
  googleId?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  status: 'active' | 'suspended' | 'banned';
  updatedAt?: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'withdrawal' | 'deposit';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Bet {
  id: string;
  playerId: string;
  amount: number;
  placedAt: Date;
  cashoutMultiplier?: number;
  status: 'active' | 'won' | 'lost';
  autoMode?: {
    enabled: boolean;
    targetMultiplier: number;
  };
}

// Define the tables
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  balance: real('balance').default(0).notNull(),
  role: text('role', { enum: ['user', 'admin', 'moderator'] }).default('user'),
  googleId: text('google_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at').notNull(),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  status: text('status', { enum: ['active', 'suspended', 'banned'] }).default('active')
});

export const bets = sqliteTable('bets', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull(),
  amount: real('amount').notNull(),
  placedAt: integer('placed_at', { mode: 'timestamp' }).notNull(),
  cashoutMultiplier: real('cashout_multiplier'),
  status: text('status', { enum: ['active', 'won', 'lost'] }).notNull(),
  autoMode: text('auto_mode', { mode: 'json' }).$type<{
    enabled: boolean;
    targetMultiplier: number;
  } | null>()
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type', { enum: ['deposit', 'withdrawal', 'bet', 'win'] }).notNull(),
  amount: real('amount').notNull(),
  status: text('status', { enum: ['pending', 'completed', 'failed'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at').notNull()
});

export const tokenBlacklist = sqliteTable('token_blacklist', {
  token: text('token').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});


// insert types
export type InsertUser = typeof users.$inferInsert;
export type InsertBet = typeof bets.$inferInsert;
export type InsertTransaction = typeof transactions.$inferInsert;

// select types
export type SelectUser = typeof users.$inferSelect;
export type SelectBet = typeof bets.$inferSelect;
export type SelectTransaction = typeof transactions.$inferSelect;

