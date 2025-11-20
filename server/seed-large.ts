
import { db } from "./db";
import { users, topicCategories, questions, tests, interviewSessions, interviewTurns, scores } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq, sql } from "drizzle-orm";

async function seedLarge() {
    console.log("🌱 Starting large data seeding...");

    try {
        // 1. Create Admin if not exists
        const [existingAdmin] = await db.select().from(users).where(eq(users.username, "admin"));
        let adminId = existingAdmin?.id;

        if (!existingAdmin) {
            const hashedPassword = await hashPassword("admin123");
            const [admin] = await db.insert(users).values({
                username: "admin",
                password: hashedPassword,
                role: "admin",
                fullName: "Admin User",
                email: "admin@example.com",
            }).returning();
            adminId = admin.id;
            console.log("✅ Created admin user");
        }

        // 2. Create 100 Students
        const studentPassword = await hashPassword("password123");
        const students = [];

        console.log("Creating 100 students...");
        for (let i = 1; i <= 100; i++) {
            const username = `student${i}`;
            const email = `student${i}@example.com`;

            // Check if exists
            const [existing] = await db.select().from(users).where(eq(users.username, username));
            if (existing) {
                students.push(existing);
                continue;
            }

            const [student] = await db.insert(users).values({
                username,
                password: studentPassword,
                role: "user",
                fullName: `Student ${i}`,
                email,
            }).returning();
            students.push(student);
        }
        console.log(`✅ Ensure ${students.length} students exist`);

        // 3. Ensure Topic Categories and Questions exist
        let [javaCategory] = await db.select().from(topicCategories).where(eq(topicCategories.name, "Java"));

        if (!javaCategory) {
            [javaCategory] = await db.insert(topicCategories).values({
                name: "Java",
                description: "Java programming",
                iconName: "BookOpen",
                createdBy: adminId,
            }).returning();

            // Add some questions
            await db.insert(questions).values([
                { topicCategoryId: javaCategory.id, questionText: "What is Java?", difficulty: "easy", createdBy: adminId, expectedKeyPoints: ["Language", "OOP"] },
                { topicCategoryId: javaCategory.id, questionText: "Explain OOP?", difficulty: "medium", createdBy: adminId, expectedKeyPoints: ["Object", "Class"] },
                { topicCategoryId: javaCategory.id, questionText: "What is JVM?", difficulty: "hard", createdBy: adminId, expectedKeyPoints: ["Virtual Machine"] },
            ]);
        }

        // 4. Ensure Tests and Questions exist with realistic answers
        const testDefinitions = [
            {
                name: "Java Fundamentals",
                category: "Java",
                questions: [
                    { q: "What is the difference between JDK, JRE, and JVM?", a: "JDK is the development kit, JRE is the runtime environment, and JVM is the virtual machine that executes bytecode." },
                    { q: "Explain the concept of inheritance in Java.", a: "Inheritance allows a class to acquire properties and methods of another class. It promotes code reusability." },
                    { q: "What is polymorphism?", a: "Polymorphism means 'many forms'. In Java, it allows objects to be treated as instances of their parent class." },
                    { q: "What is the purpose of the 'static' keyword?", a: "Static members belong to the class rather than instances. They can be accessed without creating an object." },
                    { q: "Difference between ArrayList and LinkedList?", a: "ArrayList uses a dynamic array, while LinkedList uses a doubly linked list. ArrayList is better for access, LinkedList for manipulation." }
                ]
            },
            {
                name: "Python Data Science",
                category: "Python",
                questions: [
                    { q: "What is a list comprehension?", a: "It's a concise way to create lists based on existing lists. Syntax: [expression for item in list]." },
                    { q: "Difference between tuple and list?", a: "Lists are mutable (can be changed), while tuples are immutable (cannot be changed)." },
                    { q: "What is pandas used for?", a: "Pandas is a library for data manipulation and analysis, providing data structures like DataFrames." },
                    { q: "Explain the use of 'def' keyword.", a: "'def' is used to define a function in Python." },
                    { q: "What is a lambda function?", a: "A small anonymous function defined with the lambda keyword. It can take any number of arguments but only one expression." }
                ]
            },
            {
                name: "Web Development Basics",
                category: "Web Dev", // Ensure this category exists or map to existing
                questions: [
                    { q: "What is the difference between HTML and HTML5?", a: "HTML5 is the latest version, supporting audio/video tags, canvas, and semantic elements like header/footer." },
                    { q: "Explain CSS Box Model.", a: "It consists of margins, borders, padding, and the actual content area." },
                    { q: "What is the DOM?", a: "The Document Object Model is a programming interface for HTML/XML documents, representing the page as a tree of objects." },
                    { q: "Difference between let, const, and var?", a: "Var is function-scoped, let and const are block-scoped. Const cannot be reassigned." },
                    { q: "What is a Promise in JavaScript?", a: "A Promise represents the eventual completion (or failure) of an asynchronous operation and its resulting value." }
                ]
            }
        ];

        const createdTests = [];

        for (const tDef of testDefinitions) {
            // Ensure Category
            let [category] = await db.select().from(topicCategories).where(eq(topicCategories.name, tDef.category));
            if (!category) {
                [category] = await db.insert(topicCategories).values({
                    name: tDef.category,
                    description: `${tDef.category} programming`,
                    iconName: "BookOpen",
                    createdBy: adminId,
                }).returning();
            }

            // Ensure Questions
            const questionIds: string[] = [];
            for (const qa of tDef.questions) {
                let [q] = await db.select().from(questions).where(eq(questions.questionText, qa.q));
                if (!q) {
                    [q] = await db.insert(questions).values({
                        topicCategoryId: category.id,
                        questionText: qa.q,
                        difficulty: "medium",
                        createdBy: adminId,
                        expectedKeyPoints: ["Key point 1", "Key point 2"], // Simplified
                    }).returning();
                }
                questionIds.push(q.id);
            }

            // Ensure Test
            let [test] = await db.select().from(tests).where(eq(tests.name, tDef.name));
            if (!test) {
                [test] = await db.insert(tests).values({
                    name: tDef.name,
                    description: `Assessment for ${tDef.name}`,
                    questionIds: questionIds,
                    duration: 60,
                    difficulty: "mixed",
                    isActive: true,
                    createdBy: adminId,
                }).returning();
            }
            // Attach answers to test object for easy access later
            (test as any).answersMap = tDef.questions.reduce((acc, curr, idx) => {
                acc[questionIds[idx]] = curr.a;
                return acc;
            }, {} as Record<string, string>);

            createdTests.push(test);
        }

        // 5. Generate Sessions and Answers for each student
        console.log("Generating sessions and answers...");

        for (const student of students) {
            // Assign random number of tests to each student (1 to 3)
            const numTests = Math.floor(Math.random() * createdTests.length) + 1;
            const studentTests = createdTests.slice(0, numTests);

            for (const test of studentTests) {
                // Check if student already has a session for this test
                const existingSessions = await db.select().from(interviewSessions).where(
                    sql`${interviewSessions.userId} = ${student.id} AND ${interviewSessions.testId} = ${test.id}`
                );

                if (existingSessions.length > 0) continue;

                // Random date within last 30 days
                const daysAgo = Math.floor(Math.random() * 30);
                const sessionDate = new Date();
                sessionDate.setDate(sessionDate.getDate() - daysAgo);

                // Create Session
                const [session] = await db.insert(interviewSessions).values({
                    userId: student.id,
                    testId: test.id,
                    questionIds: test.questionIds,
                    currentQuestionIndex: test.questionIds.length, // Completed
                    status: "completed",
                    startedAt: sessionDate,
                    completedAt: new Date(sessionDate.getTime() + 30 * 60000), // +30 mins
                }).returning();

                // Create Turns
                let totalScore = 0;
                let turnCount = 0;

                // Randomize performance profile for this session
                const performanceProfile = Math.random(); // 0-1
                let baseScore;
                if (performanceProfile > 0.7) baseScore = 85; // High performer
                else if (performanceProfile > 0.3) baseScore = 70; // Average
                else baseScore = 50; // Low performer

                for (let i = 0; i < test.questionIds.length; i++) {
                    const qId = test.questionIds[i];
                    // Vary score around baseScore
                    const variance = Math.floor(Math.random() * 20) - 10;
                    let scoreVal = baseScore + variance;
                    scoreVal = Math.max(0, Math.min(100, scoreVal));

                    // Get realistic answer if available
                    const realisticAnswer = (test as any).answersMap?.[qId] || "This is a generated answer.";
                    // Add some variation to the answer to make it look less static
                    const finalAnswer = Math.random() > 0.5 ? realisticAnswer : `${realisticAnswer} (Student elaborated on this point...)`;

                    await db.insert(interviewTurns).values({
                        sessionId: session.id,
                        questionId: qId,
                        turnNumber: i,
                        userAnswer: finalAnswer,
                        aiResponse: `Good answer. You correctly identified the key concepts. Score: ${scoreVal}`,
                        evaluation: {
                            grammar: scoreVal,
                            technical: scoreVal,
                            depth: scoreVal,
                            communication: scoreVal,
                            feedback: "Good understanding shown.",
                            strengths: ["Correct terminology", "Clear explanation"],
                            areasToImprove: ["Could provide more examples"],
                            recommendations: ["Review advanced concepts"],
                        }
                    });

                    totalScore += scoreVal;
                    turnCount++;
                }

                // Create Score
                const avgScore = Math.round(totalScore / turnCount);
                let grade = "F";
                if (avgScore >= 90) grade = "A";
                else if (avgScore >= 80) grade = "B";
                else if (avgScore >= 70) grade = "C";
                else if (avgScore >= 60) grade = "D";

                await db.insert(scores).values({
                    sessionId: session.id,
                    userId: student.id,
                    grammarScore: avgScore,
                    technicalScore: avgScore,
                    depthScore: avgScore,
                    communicationScore: avgScore,
                    totalScore: avgScore,
                    grade: grade,
                    detailedFeedback: {
                        strengths: ["Good"],
                        improvements: ["None"],
                        recommendations: ["Keep it up"],
                    }
                });
            }
        }
        console.log("✅ Large data seeding completed!");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        throw error;
    }

    process.exit(0);
}

seedLarge();
