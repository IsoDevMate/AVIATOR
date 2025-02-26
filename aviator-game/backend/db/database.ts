import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { users } from "../models/schema";
import { sql } from "drizzle-orm/sql";
import { eq } from "drizzle-orm/expressions";

class DatabaseService {
  private static instance: DatabaseService;
  private _db: ReturnType<typeof drizzle>;
  private _sqlite: Database.Database;

  private constructor() {
    try {
      this._sqlite = new Database("aviator.db");
      this._db = drizzle(this._sqlite);
      this.addMissingColumns(); // Call the function to add missing columns
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public get db() {
    return this._db;
  }

  public async testConnection(): Promise<{ status: string; message: string }> {
    try {
      // Try to execute a simple query
      await this._db.select().from(users).limit(1);

      return {
        status: "connected",
        message: "Successfully connected to the database"
      };
    } catch (error) {
      return {
        status: "error",
        message: `Database connection error: ${(error as Error).message}`
      };
    }
  }

  public async getDatabaseStats(): Promise<{
    tableCount: number;
    userCount: number;
    databaseSize: string;
  }> {
    try {
      // Get number of users
      const userCount = await this._db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .get();

      // Get database file size
      const { size } = this._sqlite.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };

      // Get table count
      const tableCount = this._sqlite
        .prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'")
        .get() as { count: number };

      return {
        tableCount: tableCount.count,
        userCount: userCount?.count || 0,
        databaseSize: `${(size / (1024 * 1024)).toFixed(2)} MB`
      };
    } catch (error) {
      console.error("Failed to get database stats:", error);
      throw error;
    }
  }

  public closeConnection(): void {
    try {
      this._sqlite.close();
    } catch (error) {
      console.error("Error closing database connection:", error);
      throw error;
    }
  }

  private async addMissingColumns() {
    try {
      // Execute the ALTER TABLE statements directly
      await this._db.run(`ALTER TABLE users ADD COLUMN phone_number TEXT;`);
      await this._db.run(`ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT 0 NOT NULL;`);
      console.log('Columns added successfully');
    } catch (error) {
      console.error('Error adding columns:', error);
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
export const db = databaseService.db;

// Function to check table structure
async function checkTable() {
  const tableInfo = await db.all(`PRAGMA table_info(users);`);
  console.log(tableInfo);
}

checkTable();

// Function to update phone number
async function updatePhoneNumber(userId: string) {
  try {
    await db
      .update(users)
      .set({
        phoneNumber: '+254793043014',
        phoneVerified: true
      })
      .where(eq(users.id, userId));

    console.log('Phone number updated and verified successfully');
  } catch (error) {
    console.error('Error updating phone number:', error);
  }
}

// Call with your user ID
updatePhoneNumber('a8c1640d-bb3e-4520-a329-91e8f073ccaf');
