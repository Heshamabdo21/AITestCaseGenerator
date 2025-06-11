import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use environment variable for database URL
const DATABASE_URL = process.env.DATABASE_URL;

let pool: Pool | null = null;
let db: any = null;

if (DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    // Fallback to memory storage if database fails
    pool = null;
    db = null;
  }
} else {
  console.log("ℹ️ No DATABASE_URL provided, using memory storage");
  pool = null;
  db = null;
}

export { pool, db };
