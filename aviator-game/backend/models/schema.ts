import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { boolean } from 'drizzle-orm/singlestore-core/columns/boolean';
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

// Keep the interfaces as they are...
export interface User {
  id: string;
  email: string;
  balance: number;
  username: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'moderator';
  googleId?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  status: 'active' | 'suspended' | 'banned';
  phoneNumber?: string;
  phoneVerified: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'withdrawal' | 'deposit';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
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

// Updated table definitions
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  balance: real('balance').notNull().default(0),
  role: text('role').notNull().default('user'),
  googleId: text('google_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('active'),
  phoneNumber: text('phone_number'),
  phoneVerified: integer('phone_verified', { mode: 'boolean' }).notNull().default(false)
});

export const bets = sqliteTable('bets', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => users.id),
  amount: real('amount').notNull(),
  placedAt: integer('placed_at', { mode: 'timestamp' }).notNull(),
  cashoutMultiplier: real('cashout_multiplier'),
  status: text('status').notNull(),
  autoMode: text('auto_mode', { mode: 'json' })
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const tokenBlacklist = sqliteTable('token_blacklist', {
  token: text('token').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// Type definitions
export type InsertUser = typeof users.$inferInsert;
export type InsertBet = typeof bets.$inferInsert;
export type InsertTransaction = typeof transactions.$inferInsert;

export type SelectUser = typeof users.$inferSelect;
export type SelectBet = typeof bets.$inferSelect;
export type SelectTransaction = typeof transactions.$inferSelect;
