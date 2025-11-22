
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { interviewSessions } from "@shared/schema";
import * as schema from "@shared/schema";

async function checkDb(connectionString: string, label: string) {
    console.log(`\nChecking ${label}...`);
    console.log(`URL: ${connectionString}`);

    try {
        const pool = new Pool({ connectionString });
        const db = drizzle(pool, { schema });

        const sessions = await db.select().from(interviewSessions);
        console.log(`✅ Connected! Found ${sessions.length} sessions.`);

        if (sessions.length > 0) {
            console.log("Sample session:", sessions[0]);
            return true;
        }
        await pool.end();
    } catch (error: any) {
        console.log(`❌ Failed to connect or query: ${error.message}`);
    }
    return false;
}

async function main() {
    // Try common Docker/dev configurations
    const urls = [
        "postgresql://postgres:postgres@localhost:5433/mockmate_dev",
        "postgresql://postgres:password@localhost:5433/mockmate_dev",
        "postgresql://admin:admin123@localhost:5433/mockmate_dev",
        "postgresql://sooryaakilesh@localhost:5433/mockmate_dev"
    ];

    for (const url of urls) {
        if (await checkDb(url, "Port 5433")) {
            console.log("\n🎉 Found the data! Update .env to use this URL.");
            process.exit(0);
        }
    }

    console.log("\n❌ Could not find data on port 5433 with common credentials.");
    process.exit(1);
}

main();
