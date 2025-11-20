// Database configuration - supports local PostgreSQL
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Get database URL from environment variable, default to local PostgreSQL
// Default assumes postgres user with no password (trust authentication on localhost)
// For production or custom setup, set DATABASE_URL in .env file
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:test@localhost:5432/mockmate_dev";

console.log('DATABASE_URL', DATABASE_URL);

// Determine if we need SSL (only for remote connections)
const isRemote = DATABASE_URL.includes('amazonaws.com') || 
                 DATABASE_URL.includes('render.com') || 
                 DATABASE_URL.includes('neon.tech') ||
                 DATABASE_URL.includes('supabase.co');

// Use standard PostgreSQL driver
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  // Only use SSL for remote connections
  ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {})
});

export const db = drizzle({ client: pool, schema });
