
import { db } from "../server/db";
import { users, interviewSessions, scores } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkAllUsers() {
    console.log("Checking all users and their data...\n");

    try {
        const allUsers = await db.select().from(users);

        for (const user of allUsers) {
            const sessions = await db.select().from(interviewSessions).where(eq(interviewSessions.userId, user.id));
            const userScores = await db.select().from(scores).where(eq(scores.userId, user.id));

            console.log(`User: ${user.username} (${user.role})`);
            console.log(`  - Sessions: ${sessions.length}`);
            console.log(`  - Scores: ${userScores.length}`);
            console.log();
        }

        console.log("\n💡 To see analytics, log in as a user with sessions (e.g., 'student1' with password 'password123')");

    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

checkAllUsers();
