import { db } from "./db";
import { users, topicCategories, questions, tests, interviewSessions, interviewTurns, scores } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq, sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data (in correct order due to foreign key constraints)
    console.log("🗑️  Clearing existing data...");
    await db.delete(scores);
    await db.delete(interviewTurns);
    await db.delete(interviewSessions);
    await db.delete(questions);
    await db.delete(tests);
    await db.delete(topicCategories);
    await db.delete(users);
    console.log("✅ Existing data cleared");

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

    // Create topic categories
    const [jsTopicCategory] = await db
      .insert(topicCategories)
      .values({
        name: "JavaScript Fundamentals",
        description: "Core JavaScript concepts and best practices",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    const [reactTopicCategory] = await db
      .insert(topicCategories)
      .values({
        name: "React Development",
        description: "React components, hooks, and state management",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    const [systemDesignTopicCategory] = await db
      .insert(topicCategories)
      .values({
        name: "System Design",
        description: "Scalability, architecture, and design patterns",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    console.log("✅ Created topic categories");

    // Create questions for JavaScript Fundamentals
    await db.insert(questions).values([
      {
        topicCategoryId: jsTopicCategory.id,
        questionText: "Explain the difference between let, const, and var in JavaScript.",
        difficulty: "easy",
        expectedKeyPoints: ["block scope", "hoisting", "reassignment"],
        createdBy: admin.id,
      },
      {
        topicCategoryId: jsTopicCategory.id,
        questionText: "What is a closure in JavaScript and when would you use one?",
        difficulty: "medium",
        expectedKeyPoints: ["lexical scope", "function", "private variables"],
        createdBy: admin.id,
      },
      {
        topicCategoryId: jsTopicCategory.id,
        questionText: "Explain the event loop in JavaScript.",
        difficulty: "hard",
        expectedKeyPoints: ["call stack", "callback queue", "asynchronous"],
        createdBy: admin.id,
      },
    ]);

    // Create questions for React
    await db.insert(questions).values([
      {
        topicCategoryId: reactTopicCategory.id,
        questionText: "What are React hooks and why are they useful?",
        difficulty: "easy",
        expectedKeyPoints: ["useState", "useEffect", "functional components"],
        createdBy: admin.id,
      },
      {
        topicCategoryId: reactTopicCategory.id,
        questionText: "Explain the virtual DOM and how React uses it for performance.",
        difficulty: "medium",
        expectedKeyPoints: ["diffing algorithm", "reconciliation", "performance"],
        createdBy: admin.id,
      },
      {
        topicCategoryId: reactTopicCategory.id,
        questionText: "How would you optimize a React application that has performance issues?",
        difficulty: "hard",
        expectedKeyPoints: ["memoization", "lazy loading", "code splitting"],
        createdBy: admin.id,
      },
    ]);

    // Create questions for System Design
    await db.insert(questions).values([
      {
        topicCategoryId: systemDesignTopicCategory.id,
        questionText: "How would you design a URL shortening service like bit.ly?",
        difficulty: "medium",
        expectedKeyPoints: ["database", "hash function", "scalability"],
        createdBy: admin.id,
      },
      {
        topicCategoryId: systemDesignTopicCategory.id,
        questionText: "Explain how you would design a rate limiting system.",
        difficulty: "hard",
        expectedKeyPoints: ["algorithms", "distributed systems", "caching"],
        createdBy: admin.id,
      },
    ]);

    console.log("✅ Created sample questions");

    // Get all questions for creating tests
    const jsQuestions = await db.select().from(questions).where(eq(questions.topicCategoryId, jsTopicCategory.id));
    const reactQuestions = await db.select().from(questions).where(eq(questions.topicCategoryId, reactTopicCategory.id));

    // Create tests
    const [jsTest] = await db.insert(tests).values({
      name: "JavaScript Fundamentals Test",
      description: "Test your JavaScript knowledge with fundamental concepts",
      questionIds: jsQuestions.map(q => q.id),
      duration: 30,
      difficulty: "mixed",
      isActive: true,
      createdBy: admin.id,
    }).returning();

    const [reactTest] = await db.insert(tests).values({
      name: "React Development Test", 
      description: "Comprehensive React knowledge assessment",
      questionIds: reactQuestions.map(q => q.id),
      duration: 45,
      difficulty: "mixed",
      isActive: true,
      createdBy: admin.id,
    }).returning();

    console.log("✅ Created sample tests");

    // Create completed interview sessions for testuser
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Session 1 - JavaScript (completed yesterday)
    const [session1] = await db.insert(interviewSessions).values({
      userId: sampleUser.id,
      testId: jsTest.id,
      status: "completed",
      currentQuestionIndex: 3,
      questionIds: jsQuestions.slice(0, 3).map(q => q.id),
      startedAt: oneDayAgo,
      completedAt: new Date(oneDayAgo.getTime() + 30 * 60 * 1000)
    } as any).returning();

    await db.insert(interviewTurns).values([
      {
        sessionId: session1.id,
        questionId: jsQuestions[0].id,
        turnNumber: 0,
        userAnswer: "let and const are block-scoped while var is function-scoped. const cannot be reassigned.",
        aiResponse: "Good explanation! Can you elaborate on hoisting?",
        evaluation: {
          grammar: 90,
          technical: 85,
          depth: 75,
          communication: 88,
          feedback: "Clear explanation of scoping differences",
          strengths: ["Clear explanation", "Good understanding of scoping"],
          areasToImprove: ["Could mention hoisting behavior"],
          recommendations: ["Study variable hoisting in detail"]
        }
      } as any,
      {
        sessionId: session1.id,
        questionId: jsQuestions[1].id,
        turnNumber: 1,
        userAnswer: "A closure is when a function has access to variables from its outer scope even after the outer function has returned.",
        aiResponse: "Excellent! Can you provide a practical example?",
        evaluation: {
          grammar: 92,
          technical: 88,
          depth: 82,
          communication: 90,
          feedback: "Strong understanding of closures",
          strengths: ["Concise definition", "Good technical accuracy"],
          areasToImprove: ["Could provide code example"],
          recommendations: ["Practice with real-world closure examples"]
        }
      } as any,
      {
        sessionId: session1.id,
        questionId: jsQuestions[2].id,
        turnNumber: 2,
        userAnswer: "The event loop continuously checks the call stack and task queue. When the stack is empty, it moves tasks from the queue to the stack.",
        aiResponse: "Great answer! You clearly understand the event loop.",
        evaluation: {
          grammar: 95,
          technical: 90,
          depth: 88,
          communication: 92,
          feedback: "Excellent explanation of event loop mechanics",
          strengths: ["Complete explanation", "Good technical depth"],
          areasToImprove: ["Could mention microtasks vs macrotasks"],
          recommendations: ["Explore Promise queue vs callback queue"]
        }
      } as any
    ]);

    await db.insert(scores).values({
      sessionId: session1.id,
      userId: sampleUser.id,
      grammarScore: 92,
      technicalScore: 88,
      depthScore: 82,
      communicationScore: 90,
      totalScore: 88,
      grade: "B",
      detailedFeedback: {
        strengths: ["Clear explanation", "Good understanding of scoping", "Concise definition"],
        improvements: ["Could mention hoisting behavior", "Could provide code example"],
        recommendations: ["Study variable hoisting in detail", "Practice with real-world closure examples"]
      }
    } as any);

    // Session 2 - React (completed 2 days ago)
    const [session2] = await db.insert(interviewSessions).values({
      userId: sampleUser.id,
      testId: reactTest.id,
      status: "completed",
      currentQuestionIndex: 2,
      questionIds: reactQuestions.slice(0, 2).map(q => q.id),
      startedAt: twoDaysAgo,
      completedAt: new Date(twoDaysAgo.getTime() + 25 * 60 * 1000)
    } as any).returning();

    await db.insert(interviewTurns).values([
      {
        sessionId: session2.id,
        questionId: reactQuestions[0].id,
        turnNumber: 0,
        userAnswer: "React hooks like useState and useEffect allow functional components to have state and lifecycle methods.",
        aiResponse: "Good! Can you explain why hooks were introduced?",
        evaluation: {
          grammar: 88,
          technical: 92,
          depth: 85,
          communication: 90,
          feedback: "Strong grasp of hooks",
          strengths: ["Clear explanation", "Mentioned key hooks"],
          areasToImprove: ["Could discuss the motivation behind hooks"],
          recommendations: ["Study hooks design philosophy"]
        }
      } as any,
      {
        sessionId: session2.id,
        questionId: reactQuestions[1].id,
        turnNumber: 1,
        userAnswer: "The virtual DOM is a lightweight copy of the actual DOM. React uses it to efficiently update only the parts that changed.",
        aiResponse: "Excellent understanding!",
        evaluation: {
          grammar: 90,
          technical: 88,
          depth: 80,
          communication: 87,
          feedback: "Good understanding of virtual DOM",
          strengths: ["Correct explanation", "Mentioned efficiency"],
          areasToImprove: ["Could explain the diffing algorithm"],
          recommendations: ["Deep dive into reconciliation process"]
        }
      } as any
    ]);

    await db.insert(scores).values({
      sessionId: session2.id,
      userId: sampleUser.id,
      grammarScore: 89,
      technicalScore: 90,
      depthScore: 83,
      communicationScore: 89,
      totalScore: 88,
      grade: "B",
      detailedFeedback: {
        strengths: ["Clear explanation", "Mentioned key hooks", "Correct explanation"],
        improvements: ["Could discuss the motivation behind hooks", "Could explain the diffing algorithm"],
        recommendations: ["Study hooks design philosophy", "Deep dive into reconciliation process"]
      }
    } as any);

    // Session 3 - JavaScript (excellent score, 3 days ago)
    const [session3] = await db.insert(interviewSessions).values({
      userId: sampleUser.id,
      testId: jsTest.id,
      status: "completed",
      currentQuestionIndex: 2,
      questionIds: jsQuestions.slice(0, 2).map(q => q.id),
      startedAt: threeDaysAgo,
      completedAt: new Date(threeDaysAgo.getTime() + 20 * 60 * 1000)
    } as any).returning();

    await db.insert(interviewTurns).values([
      {
        sessionId: session3.id,
        questionId: jsQuestions[0].id,
        turnNumber: 0,
        userAnswer: "let and const are block-scoped variables introduced in ES6. var is function-scoped and hoisted to the top of its scope. const creates read-only references.",
        aiResponse: "Perfect! Very comprehensive.",
        evaluation: {
          grammar: 95,
          technical: 95,
          depth: 92,
          communication: 94,
          feedback: "Outstanding understanding",
          strengths: ["Complete explanation", "Mentioned ES6", "Professional terminology"],
          areasToImprove: ["Already excellent"],
          recommendations: ["Explore advanced ES6+ features"]
        }
      } as any,
      {
        sessionId: session3.id,
        questionId: jsQuestions[1].id,
        turnNumber: 1,
        userAnswer: "Closures occur when an inner function has access to the outer function's variables. They're useful for data privacy, creating function factories, and managing state in callbacks.",
        aiResponse: "Excellent! Perfect answer.",
        evaluation: {
          grammar: 96,
          technical: 94,
          depth: 90,
          communication: 95,
          feedback: "Excellent technical knowledge",
          strengths: ["Comprehensive answer", "Multiple use cases", "Clear examples"],
          areasToImprove: ["None"],
          recommendations: ["Practice implementing design patterns"]
        }
      } as any
    ]);

    await db.insert(scores).values({
      sessionId: session3.id,
      userId: sampleUser.id,
      grammarScore: 96,
      technicalScore: 95,
      depthScore: 91,
      communicationScore: 95,
      totalScore: 94,
      grade: "A",
      detailedFeedback: {
        strengths: ["Complete explanation", "Mentioned ES6", "Professional terminology", "Comprehensive answer", "Multiple use cases"],
        improvements: ["Already excellent"],
        recommendations: ["Explore advanced ES6+ features", "Practice implementing design patterns"]
      }
    } as any);

    console.log("✅ Created 3 completed interview sessions with scores");

    console.log(`
🎉 Seeding completed successfully!

📝 Test Credentials:
   Admin: admin / admin123
   User:  testuser / user123

📊 Sample Data Created:
   - 3 completed interview sessions for testuser
   - Scores: A (94%), B (88%), B (88%)
   - Topics: JavaScript, React, System Design

🚀 You can now log in and start using the application!
    `);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }

  process.exit(0);
}

seed();
