import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import { users, bets, transactions } from '../../models/schema';

// Migration function
export async function migrate() {
  const sqlite = new Database('aviator.db');
  const db = drizzle(sqlite);

  // Create users table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      role TEXT CHECK(role IN ('user', 'admin', 'moderator')) DEFAULT 'user',
      google_id TEXT,
      created_at INTEGER NOT NULL,
      last_login_at INTEGER,
      status TEXT CHECK(status IN ('active', 'suspended', 'banned')) DEFAULT 'active'
    );
  `);

  // Create bets table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS bets (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      amount REAL NOT NULL,
      placed_at INTEGER NOT NULL,
      cashout_multiplier REAL,
      status TEXT CHECK(status IN ('active', 'won', 'lost')) NOT NULL,
      auto_mode TEXT,
      FOREIGN KEY (player_id) REFERENCES users(id)
    );
  `);

  // Create transactions table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('deposit', 'withdrawal', 'bet', 'win')) NOT NULL,
      amount REAL NOT NULL,
      status TEXT CHECK(status IN ('pending', 'completed', 'failed')) NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS bets_player_id_index ON bets(player_id);
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS transactions_user_id_index ON transactions(user_id);
  `);

  //Create token_blaist  table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS token_blaist (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
  
  console.log('Migration completed successfully');
  sqlite.close();
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate().catch(console.error);
}
