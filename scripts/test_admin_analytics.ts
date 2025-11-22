
import { storage } from "../server/storage";

async function testAdminAnalytics() {
    console.log("Testing admin analytics...\n");

    try {
        const analytics = await storage.getAdminAnalytics();
        console.log("Admin Analytics Result:");
        console.log(JSON.stringify(analytics, null, 2));

        if (analytics.totalSessions === 0) {
            console.log("\n⚠️  No sessions found. Run 'npx tsx -r dotenv/config scripts/seed_analytics_data.ts' to seed data.");
        } else {
            console.log(`\n✅ Found ${analytics.totalSessions} sessions`);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
    process.exit(0);
}

testAdminAnalytics();
