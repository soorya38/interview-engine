
import { db } from "../server/db";
import { interviewSessions, interviewTurns, scores } from "@shared/schema";

async function clearAnalytics() {
    console.log("🗑️  Clearing analytics data...");

    try {
        await db.delete(scores);
        await db.delete(interviewTurns);
        await db.delete(interviewSessions);

        console.log("✅ Analytics data cleared (Sessions, Turns, Scores).");
        console.log("Users, Tests, and Questions remain intact.");

    } catch (error) {
        console.error("❌ Failed to clear data:", error);
    }
    process.exit(0);
}

clearAnalytics();
