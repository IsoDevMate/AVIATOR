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
// User Table Schema
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  balance: real('balance').default(0).notNull(),
  role: text('role', { enum: ['user', 'admin', 'moderator'] }).default('user'),
  googleId: text('google_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  status: text('status', {
    enum: ['active', 'suspended', 'banned']
  }).default('active')
});

// Bet Table Schema
export const bets = sqliteTable('bets', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull(),
  amount: real('amount').notNull(),
  placedAt: integer('placed_at', { mode: 'timestamp' }).notNull(),
  cashoutMultiplier: real('cashout_multiplier'),
  status: text('status', {
    enum: ['active', 'won', 'lost']
  }).notNull(),
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
});

export const tokenBlacklist = sqliteTable('token_blacklist', {
  token: text('token').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});


// // Game State Table Schema
// export const gameStates = sqliteTable('game_states', {
//   status: text('status', {
//     enum: ['betting', 'flying', 'crashed']
//   }).notNull(),
//   currentMultiplier: real('current_multiplier').notNull(),
//   crashPoint: real('crash_point').notNull(),
//   startTime: integer('start_time', { mode: 'timestamp' }),
//   endTime: integer('end_time', { mode: 'timestamp' }),
//   roundId: text('round_id').notNull()
// });

// Insert Schema
export const insertUserSchema = createInsertSchema(users);
export const insertBetSchema = createInsertSchema(bets);
export const insertTransactionSchema = createInsertSchema(transactions);
