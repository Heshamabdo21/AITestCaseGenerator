import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: any = null;

if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "test") {
  console.warn("⚠️  DATABASE_URL not configured properly. Database operations will fail until a valid PostgreSQL connection string is provided.");
  console.warn("Current DATABASE_URL value:", process.env.DATABASE_URL);
} else {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Failed to establish database connection:", error);
  }
}

export { pool, db };
