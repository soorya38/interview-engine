// Database configuration - supports both local PostgreSQL and Neon
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Hardcoded database connection string
const DATABASE_URL = "postgresql://test_user:c335ex57pfp5WKNWqqaefl8MBLwD88OC@dpg-d43hvv3ipnbc73bu7pk0-a.singapore-postgres.render.com:5432/test_db_s8pm";

// Use standard PostgreSQL driver for local development
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle({ client: pool, schema });
