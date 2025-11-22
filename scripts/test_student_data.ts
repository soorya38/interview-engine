
import { db } from "../server/db";
import { users, interviewSessions, scores } from "@shared/schema";
import { eq } from "drizzle-orm";

async function testStudentData() {
    console.log("Testing student data...");

    try {
        const [user] = await db.select().from(users).where(eq(users.username, "student1"));
        if (!user) {
            console.log("❌ User 'student1' not found.");
            process.exit(1);
        }
        console.log(`✅ Found user: ${user.username} (${user.id})`);

        const sessions = await db.select().from(interviewSessions).where(eq(interviewSessions.userId, user.id));
        console.log(`✅ Found ${sessions.length} sessions for user.`);

        const userScores = await db.select().from(scores).where(eq(scores.userId, user.id));
        console.log(`✅ Found ${userScores.length} scores for user.`);

        if (sessions.length > 0 && userScores.length > 0) {
            console.log("🎉 Student data verification successful!");
        } else {
            console.log("❌ Missing sessions or scores.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

testStudentData();
