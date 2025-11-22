
import { storage } from "../server/storage";

async function main() {
    try {
        console.log("Testing getAdminAnalytics...");
        const analytics = await storage.getAdminAnalytics();
        console.log("Success! Result:", JSON.stringify(analytics, null, 2));
    } catch (error) {
        console.error("Error in getAdminAnalytics:", error);
    }
    process.exit(0);
}

main();
