import { defineConfig } from "drizzle-kit";

// Hardcoded database connection string
const DATABASE_URL = "postgresql://test_user:c335ex57pfp5WKNWqqaefl8MBLwD88OC@dpg-d43hvv3ipnbc73bu7pk0-a.singapore-postgres.render.com:5432/test_db_s8pm";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
