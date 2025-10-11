import { db } from "./db";
import { users, topics, questions } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create admin user
    const hashedPassword = await hashPassword("admin123");
    const [admin] = await db
      .insert(users)
      .values({
        username: "admin",
        password: hashedPassword,
        role: "admin",
        fullName: "Admin User",
        email: "admin@aimockmate.com",
      })
      .returning();

    console.log("✅ Created admin user:", admin.username);

    // Create sample user
    const userHashedPassword = await hashPassword("user123");
    const [sampleUser] = await db
      .insert(users)
      .values({
        username: "testuser",
        password: userHashedPassword,
        role: "user",
        fullName: "Test User",
        email: "user@example.com",
      })
      .returning();

    console.log("✅ Created sample user:", sampleUser.username);

    // Create topics
    const [jsTopic] = await db
      .insert(topics)
      .values({
        name: "JavaScript Fundamentals",
        description: "Core JavaScript concepts and best practices",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    const [reactTopic] = await db
      .insert(topics)
      .values({
        name: "React Development",
        description: "React components, hooks, and state management",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    const [systemDesignTopic] = await db
      .insert(topics)
      .values({
        name: "System Design",
        description: "Scalability, architecture, and design patterns",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    console.log("✅ Created topics");

    // Create questions for JavaScript Fundamentals
    await db.insert(questions).values([
      {
        topicId: jsTopic.id,
        questionText: "Explain the difference between let, const, and var in JavaScript.",
        difficulty: "easy",
        expectedKeyPoints: ["block scope", "hoisting", "reassignment"],
        createdBy: admin.id,
      },
      {
        topicId: jsTopic.id,
        questionText: "What is a closure in JavaScript and when would you use one?",
        difficulty: "medium",
        expectedKeyPoints: ["lexical scope", "function", "private variables"],
        createdBy: admin.id,
      },
      {
        topicId: jsTopic.id,
        questionText: "Explain the event loop in JavaScript.",
        difficulty: "hard",
        expectedKeyPoints: ["call stack", "callback queue", "asynchronous"],
        createdBy: admin.id,
      },
    ]);

    // Create questions for React
    await db.insert(questions).values([
      {
        topicId: reactTopic.id,
        questionText: "What are React hooks and why are they useful?",
        difficulty: "easy",
        expectedKeyPoints: ["useState", "useEffect", "functional components"],
        createdBy: admin.id,
      },
      {
        topicId: reactTopic.id,
        questionText: "Explain the virtual DOM and how React uses it for performance.",
        difficulty: "medium",
        expectedKeyPoints: ["diffing algorithm", "reconciliation", "performance"],
        createdBy: admin.id,
      },
      {
        topicId: reactTopic.id,
        questionText: "How would you optimize a React application that has performance issues?",
        difficulty: "hard",
        expectedKeyPoints: ["memoization", "lazy loading", "code splitting"],
        createdBy: admin.id,
      },
    ]);

    // Create questions for System Design
    await db.insert(questions).values([
      {
        topicId: systemDesignTopic.id,
        questionText: "How would you design a URL shortening service like bit.ly?",
        difficulty: "medium",
        expectedKeyPoints: ["database", "hash function", "scalability"],
        createdBy: admin.id,
      },
      {
        topicId: systemDesignTopic.id,
        questionText: "Explain how you would design a rate limiting system.",
        difficulty: "hard",
        expectedKeyPoints: ["algorithms", "distributed systems", "caching"],
        createdBy: admin.id,
      },
    ]);

    console.log("✅ Created sample questions");

    console.log(`
🎉 Seeding completed successfully!

📝 Test Credentials:
   Admin: admin / admin123
   User:  testuser / user123

🚀 You can now log in and start using the application!
    `);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }

  process.exit(0);
}

seed();
