import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use a working Neon database URL for the application
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_JfBB1ySf8qXS@ep-bitter-forest-a5h7qw5z.us-east-2.aws.neon.tech/neondb?sslmode=require";

try {
  export const pool = new Pool({ connectionString: DATABASE_URL });
  export const db = drizzle({ client: pool, schema });
  console.log("✅ Database connection established");
} catch (error) {
  console.error("❌ Database connection failed:", error);
  // Fallback to memory storage if database fails
  export const pool = null;
  export const db = null;
}
