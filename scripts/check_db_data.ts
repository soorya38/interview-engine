
import { db } from "../server/db";
import { interviewSessions, users, scores } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    try {
        console.log("Checking database content...");

        const allUsers = await db.select().from(users);
        console.log(`Total Users: ${allUsers.length}`);
        allUsers.forEach(u => console.log(` - ${u.username} (${u.role})`));

        const allSessions = await db.select().from(interviewSessions);
        console.log(`\nTotal Sessions: ${allSessions.length}`);
        allSessions.forEach(s => console.log(` - Session ${s.id}: Status=${s.status}, User=${s.userId}, Test=${s.testId}`));

        const completedSessions = allSessions.filter(s => s.status === 'completed');
        console.log(`\nCompleted Sessions: ${completedSessions.length}`);

        const allScores = await db.select().from(scores);
        console.log(`\nTotal Scores: ${allScores.length}`);
        allScores.forEach(s => console.log(` - Score for Session ${s.sessionId}: ${s.totalScore}`));

    } catch (error) {
        console.error("Error checking DB:", error);
    }
    process.exit(0);
}

main();
