import { defineConfig } from "drizzle-kit";

// Get database URL from environment variable, default to local PostgreSQL
// Default assumes postgres user with no password (trust authentication on localhost)
// For production or custom setup, set DATABASE_URL in .env file
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres@localhost:5432/mockmate_dev";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
