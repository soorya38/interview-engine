
import { db } from "../server/db";
import { users, topicCategories, questions, tests, interviewSessions, interviewTurns, scores } from "@shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

async function seedAnalytics() {
    console.log("🌱 Seeding analytics data...");

    try {
        // 1. Get Admin User
        const [admin] = await db.select().from(users).where(eq(users.username, "admin"));
        if (!admin) {
            throw new Error("Admin user not found. Run 'npm run seed' first.");
        }

        // 2. Create Topic Category
        const [topic] = await db.insert(topicCategories).values({
            name: "Frontend Development",
            description: "HTML, CSS, and React",
            createdBy: admin.id,
        }).returning();
        console.log("✅ Created Topic:", topic.name);

        // 3. Create Questions
        const questionIds = [];
        for (let i = 1; i <= 3; i++) {
            const [q] = await db.insert(questions).values({
                topicCategoryId: topic.id,
                questionText: `Sample Question ${i}`,
                difficulty: "medium",
                createdBy: admin.id,
            }).returning();
            questionIds.push(q.id);
        }
        console.log(`✅ Created ${questionIds.length} Questions`);

        // 4. Create Test
        const [test] = await db.insert(tests).values({
            name: "React Basics",
            description: "Test your React knowledge",
            questionIds: questionIds,
            createdBy: admin.id,
            timeLimit: 30,
            passingScore: 70,
        }).returning();
        console.log("✅ Created Test:", test.name);

        // 5. Create Students and Sessions
        const students = ["student1", "student2", "student3"];
        const password = await hashPassword("password123");

        for (const username of students) {
            // Create user
            let [user] = await db.select().from(users).where(eq(users.username, username));
            if (!user) {
                [user] = await db.insert(users).values({
                    username,
                    password,
                    role: "user",
                    fullName: `Student ${username.slice(-1)}`,
                    email: `${username}@example.com`,
                }).returning();
            }

            // Create Session
            const [session] = await db.insert(interviewSessions).values({
                userId: user.id,
                testId: test.id,
                questionIds: questionIds,
                currentQuestionIndex: 3,
                status: "completed",
                startedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
                completedAt: new Date(),
            }).returning();

            // Create Score
            const totalScore = Math.floor(Math.random() * 30) + 70; // 70-100
            await db.insert(scores).values({
                sessionId: session.id,
                userId: user.id,
                grammarScore: 80,
                technicalScore: totalScore,
                depthScore: 75,
                communicationScore: 85,
                totalScore: totalScore,
                grade: totalScore >= 90 ? "A" : totalScore >= 80 ? "B" : "C",
                detailedFeedback: { strengths: ["Good"], improvements: ["None"], recommendations: ["Keep it up"] },
            });

            console.log(`✅ Created Session for ${username} with score ${totalScore}`);
        }

        console.log("\n🎉 Analytics data seeded successfully!");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
    }
    process.exit(0);
}

seedAnalytics();
