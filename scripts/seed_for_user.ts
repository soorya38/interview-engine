
import { db } from "../server/db";
import { users, topicCategories, questions, tests, interviewSessions, scores } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedForUser(username: string) {
    console.log(`🌱 Seeding analytics data for user: ${username}\n`);

    try {
        // 1. Get user
        const [user] = await db.select().from(users).where(eq(users.username, username));
        if (!user) {
            console.log(`❌ User '${username}' not found.`);
            console.log("Available users:");
            const allUsers = await db.select().from(users);
            allUsers.forEach(u => console.log(`  - ${u.username} (${u.role})`));
            process.exit(1);
        }
        console.log(`✅ Found user: ${user.username}`);

        // 2. Get or create topic and test
        let topic = await db.select().from(topicCategories).limit(1);
        let test = await db.select().from(tests).limit(1);

        if (topic.length === 0 || test.length === 0) {
            console.log("❌ No topics/tests found. Run seed_analytics_data.ts first.");
            process.exit(1);
        }

        const testId = test[0].id;
        const questionIds = test[0].questionIds || [];

        console.log(`✅ Using test: ${test[0].name}`);

        // 3. Create 3 sessions for this user
        for (let i = 1; i <= 3; i++) {
            const [session] = await db.insert(interviewSessions).values({
                userId: user.id,
                testId: testId,
                questionIds: questionIds,
                currentQuestionIndex: questionIds.length,
                status: "completed",
                startedAt: new Date(Date.now() - 1000 * 60 * 60 * i), // i hours ago
                completedAt: new Date(Date.now() - 1000 * 60 * 30 * i), // i*30 minutes ago
            }).returning();

            const totalScore = Math.floor(Math.random() * 30) + 70; // 70-100
            await db.insert(scores).values({
                sessionId: session.id,
                userId: user.id,
                grammarScore: 80 + Math.floor(Math.random() * 15),
                technicalScore: totalScore,
                depthScore: 75 + Math.floor(Math.random() * 15),
                communicationScore: 85 + Math.floor(Math.random() * 10),
                totalScore: totalScore,
                grade: totalScore >= 90 ? "A" : totalScore >= 80 ? "B" : "C",
                detailedFeedback: {
                    strengths: ["Good communication", "Clear explanations"],
                    improvements: ["Add more detail"],
                    recommendations: ["Practice more"]
                },
            });

            console.log(`✅ Created session ${i} with score ${totalScore}`);
        }

        console.log(`\n🎉 Successfully seeded 3 sessions for ${username}!`);
        console.log(`\n💡 Visit /analytics to see the data.`);

    } catch (error) {
        console.error("❌ Error:", error);
    }
    process.exit(0);
}

const username = process.argv[2] || "soorya";
seedForUser(username);
