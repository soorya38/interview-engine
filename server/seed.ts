import { db } from "./db";
import { users, topicCategories, questions, tests, interviewSessions, interviewTurns, scores } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq, sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data (in correct order due to foreign key constraints)
    console.log("Clearing existing data...");
    await db.delete(scores);
    await db.delete(interviewTurns);
    await db.delete(interviewSessions);
    await db.delete(questions);
    await db.delete(tests);
    await db.delete(topicCategories);
    await db.delete(users);
    console.log("Existing data cleared");

    // Create admin user
    const hashedPassword = await hashPassword("admin123");
    const [admin] = await db
      .insert(users)
      .values({
        username: "admin",
        password: hashedPassword,
        role: "admin",
        fullName: "Admin User",
        email: "admin@gmail.com",
      })
      .returning();

    console.log("Created admin user:", admin.username);

    // Create all student users with password "Siet@123"
    const studentPassword = await hashPassword("Siet@123");
    const studentEmails = [
      "soorya@gmail.com",
      "sharvesh@gmail.com",
      "sudhir@gmail.com",
      "vishwanathan@gmail.com",
    ];

    const studentUsers = [];
    for (const email of studentEmails) {
      // Extract username from email (part before @)
      const username = email.split("@")[0];
      // Extract full name from username (capitalize first letters)
      const fullName = username
        .replace(/[0-9]/g, " ")
        .split(" ")
        .filter((s) => s.length > 0)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const [user] = await db
        .insert(users)
        .values({
          username,
          password: studentPassword,
          role: "user",
          fullName: fullName || username,
          email,
        })
        .returning();

      studentUsers.push(user);
    }

    console.log(` Created ${studentUsers.length} student users`);

    // Create topic categories (School Subjects)
    const [mathTopicCategory] = await db
      .insert(topicCategories)
      .values({
        name: "Mathematics",
        description: "Mathematics concepts including algebra, geometry, and calculus",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    const [scienceTopicCategory] = await db
      .insert(topicCategories)
      .values({
        name: "Science",
        description: "Science topics covering physics, chemistry, and biology",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    const [englishTopicCategory] = await db
      .insert(topicCategories)
      .values({
        name: "English",
        description: "English language, literature, and communication skills",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    const [historyTopicCategory] = await db
      .insert(topicCategories)
      .values({
        name: "History",
        description: "World history, historical events, and civilizations",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    console.log(" Created topic categories: Mathematics, Science, English, History");

    // Create Mathematics questions
    const mathQuestions = [
      {
        questionText: "Explain the Pythagorean theorem and provide an example of its application.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["a² + b² = c²", "right triangle", "hypotenuse", "example"],
      },
      {
        questionText: "What is the difference between mean, median, and mode? Provide an example.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["mean", "median", "mode", "average", "example"],
      },
      {
        questionText: "Explain how to solve a quadratic equation using the quadratic formula.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["ax² + bx + c = 0", "quadratic formula", "discriminant", "solutions"],
      },
      {
        questionText: "What is the difference between prime and composite numbers? Give examples.",
        difficulty: "easy" as const,
        expectedKeyPoints: ["prime numbers", "composite numbers", "factors", "examples"],
      },
      {
        questionText: "Explain the concept of slope in linear equations. How do you calculate it?",
        difficulty: "medium" as const,
        expectedKeyPoints: ["slope", "rise over run", "y = mx + b", "calculation"],
      },
      {
        questionText: "What is the area of a circle? Explain the formula and its components.",
        difficulty: "easy" as const,
        expectedKeyPoints: ["πr²", "radius", "pi", "circle area"],
      },
      {
        questionText: "Describe the order of operations (PEMDAS) and why it's important.",
        difficulty: "easy" as const,
        expectedKeyPoints: ["PEMDAS", "BODMAS", "order", "operations", "parentheses"],
      },
      {
        questionText: "Explain the concept of derivatives in calculus and their practical applications.",
        difficulty: "hard" as const,
        expectedKeyPoints: ["derivative", "rate of change", "calculus", "applications"],
      },
      {
        questionText: "What is the difference between permutations and combinations? Provide examples.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["permutations", "combinations", "order matters", "examples"],
      },
      {
        questionText: "Explain the properties of exponents with examples.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["exponents", "properties", "multiplication", "division", "examples"],
      },
    ];

    await db.insert(questions).values(
      mathQuestions.map((q) => ({
        topicCategoryId: mathTopicCategory.id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        expectedKeyPoints: q.expectedKeyPoints,
        createdBy: admin.id,
      }))
    );

    console.log(` Created ${mathQuestions.length} Mathematics questions`);

    // Create Science questions
    const scienceQuestions = [
      {
        questionText: "Explain the water cycle and describe each stage in detail.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["evaporation", "condensation", "precipitation", "collection"],
      },
      {
        questionText: "What is photosynthesis? Explain the process and its importance.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["photosynthesis", "chlorophyll", "carbon dioxide", "oxygen", "glucose"],
      },
      {
        questionText: "Describe Newton's three laws of motion with examples for each.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["Newton's laws", "inertia", "force", "action-reaction", "examples"],
      },
      {
        questionText: "What is the difference between an atom and a molecule? Provide examples.",
        difficulty: "easy" as const,
        expectedKeyPoints: ["atom", "molecule", "element", "compound", "examples"],
      },
      {
        questionText: "Explain the structure and function of DNA in living organisms.",
        difficulty: "hard" as const,
        expectedKeyPoints: ["DNA", "double helix", "nucleotides", "genetic information"],
      },
      {
        questionText: "What is the greenhouse effect and why is it important for Earth's climate?",
        difficulty: "medium" as const,
        expectedKeyPoints: ["greenhouse effect", "carbon dioxide", "global warming", "atmosphere"],
      },
      {
        questionText: "Describe the difference between physical and chemical changes with examples.",
        difficulty: "easy" as const,
        expectedKeyPoints: ["physical change", "chemical change", "reversible", "examples"],
      },
      {
        questionText: "Explain the process of cellular respiration and its significance.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["cellular respiration", "mitochondria", "ATP", "energy"],
      },
      {
        questionText: "What is the difference between renewable and non-renewable energy sources?",
        difficulty: "easy" as const,
        expectedKeyPoints: ["renewable", "non-renewable", "solar", "fossil fuels", "examples"],
      },
      {
        questionText: "Describe the human circulatory system and explain how blood flows through the body.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["heart", "arteries", "veins", "blood flow", "circulation"],
      },
    ];

    await db.insert(questions).values(
      scienceQuestions.map((q) => ({
        topicCategoryId: scienceTopicCategory.id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        expectedKeyPoints: q.expectedKeyPoints,
        createdBy: admin.id,
      }))
    );

    console.log(` Created ${scienceQuestions.length} Science questions`);

    // Create English questions
    const englishQuestions = [
      {
        questionText: "Explain the difference between a simile and a metaphor with examples.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["simile", "metaphor", "comparison", "like", "as", "examples"],
      },
      {
        questionText: "What is the difference between active and passive voice? Provide examples.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["active voice", "passive voice", "subject", "object", "examples"],
      },
      {
        questionText: "Describe the three main types of point of view in literature with examples.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["first person", "second person", "third person", "narrator", "examples"],
      },
      {
        questionText: "What is the difference between a topic sentence and a thesis statement?",
        difficulty: "easy" as const,
        expectedKeyPoints: ["topic sentence", "thesis statement", "paragraph", "essay"],
      },
      {
        questionText: "Explain the use of figurative language in poetry and provide examples.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["figurative language", "imagery", "symbolism", "poetry", "examples"],
      },
      {
        questionText: "What are the key elements of a well-structured essay?",
        difficulty: "easy" as const,
        expectedKeyPoints: ["introduction", "body paragraphs", "conclusion", "thesis", "structure"],
      },
      {
        questionText: "Describe the difference between denotation and connotation with examples.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["denotation", "connotation", "dictionary meaning", "implied meaning", "examples"],
      },
      {
        questionText: "Explain the importance of proper punctuation in written communication.",
        difficulty: "easy" as const,
        expectedKeyPoints: ["punctuation", "clarity", "meaning", "communication"],
      },
      {
        questionText: "What is the difference between a primary and secondary source?",
        difficulty: "medium" as const,
        expectedKeyPoints: ["primary source", "secondary source", "original", "interpretation", "research"],
      },
      {
        questionText: "Describe the characteristics of different literary genres with examples.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["fiction", "non-fiction", "poetry", "drama", "genre", "examples"],
      },
    ];

    await db.insert(questions).values(
      englishQuestions.map((q) => ({
        topicCategoryId: englishTopicCategory.id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        expectedKeyPoints: q.expectedKeyPoints,
        createdBy: admin.id,
      }))
    );

    console.log(` Created ${englishQuestions.length} English questions`);

    // Create History questions
    const historyQuestions = [
      {
        questionText: "Explain the causes and consequences of World War I.",
        difficulty: "hard" as const,
        expectedKeyPoints: ["World War I", "alliances", "assassination", "treaty", "consequences"],
      },
      {
        questionText: "Describe the significance of the Renaissance period in European history.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["Renaissance", "Italy", "art", "science", "humanism", "impact"],
      },
      {
        questionText: "What were the main causes of the American Revolution?",
        difficulty: "medium" as const,
        expectedKeyPoints: ["taxation", "representation", "independence", "British rule", "causes"],
      },
      {
        questionText: "Explain the importance of the Industrial Revolution and its global impact.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["Industrial Revolution", "technology", "economy", "social change", "impact"],
      },
      {
        questionText: "Describe the key events and significance of the Civil Rights Movement.",
        difficulty: "hard" as const,
        expectedKeyPoints: ["civil rights", "equality", "leadership", "events", "significance"],
      },
      {
        questionText: "What was the Cold War and how did it affect international relations?",
        difficulty: "hard" as const,
        expectedKeyPoints: ["Cold War", "USA", "USSR", "tensions", "proxy wars", "impact"],
      },
      {
        questionText: "Explain the causes and effects of the French Revolution.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["French Revolution", "causes", "effects", "monarchy", "democracy"],
      },
      {
        questionText: "Describe the major achievements of ancient civilizations like Egypt or Mesopotamia.",
        difficulty: "medium" as const,
        expectedKeyPoints: ["ancient civilizations", "achievements", "culture", "technology", "contributions"],
      },
      {
        questionText: "What was the significance of the Magna Carta in the development of democracy?",
        difficulty: "medium" as const,
        expectedKeyPoints: ["Magna Carta", "democracy", "rights", "limitation of power", "significance"],
      },
      {
        questionText: "Explain the impact of colonialism on different regions of the world.",
        difficulty: "hard" as const,
        expectedKeyPoints: ["colonialism", "imperialism", "economic", "cultural", "political", "impact"],
      },
    ];

    await db.insert(questions).values(
      historyQuestions.map((q) => ({
        topicCategoryId: historyTopicCategory.id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        expectedKeyPoints: q.expectedKeyPoints,
        createdBy: admin.id,
      }))
    );

    console.log(` Created ${historyQuestions.length} History questions`);

    // Get all questions for creating tests
    const allMathQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.topicCategoryId, mathTopicCategory.id));
    
    const allScienceQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.topicCategoryId, scienceTopicCategory.id));

    const allEnglishQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.topicCategoryId, englishTopicCategory.id));

    const allHistoryQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.topicCategoryId, historyTopicCategory.id));

    // Create tests
    const [mathTest] = await db
      .insert(tests)
      .values({
        name: "Mathematics Fundamentals Test",
        description: "Comprehensive mathematics assessment covering algebra, geometry, and problem-solving",
        questionIds: allMathQuestions.map((q) => q.id),
        duration: 60,
        difficulty: "mixed",
        isActive: true,
        createdBy: admin.id,
      })
      .returning();

    const [scienceTest] = await db
      .insert(tests)
      .values({
        name: "Science Fundamentals Test",
        description: "Comprehensive science assessment covering physics, chemistry, and biology concepts",
        questionIds: allScienceQuestions.map((q) => q.id),
        duration: 60,
        difficulty: "mixed",
        isActive: true,
        createdBy: admin.id,
      })
      .returning();

    const [englishTest] = await db
      .insert(tests)
      .values({
        name: "English Language and Literature Test",
        description: "Assessment covering language skills, literary analysis, and communication",
        questionIds: allEnglishQuestions.map((q) => q.id),
        duration: 60,
        difficulty: "mixed",
        isActive: true,
        createdBy: admin.id,
      })
      .returning();

    const [historyTest] = await db
      .insert(tests)
      .values({
        name: "World History Test",
        description: "Comprehensive history assessment covering major events, civilizations, and historical periods",
        questionIds: allHistoryQuestions.map((q) => q.id),
        duration: 60,
        difficulty: "mixed",
        isActive: true,
        createdBy: admin.id,
      })
      .returning();

    console.log(" Created Mathematics, Science, English, and History tests");

    console.log(`
🎉 Seeding completed successfully!

📝 Admin Credentials:
   Username: admin
   Password: admin123
   Email: admin@gmail.com

📝 Student Credentials:
   Total Students: ${studentUsers.length}
   All students have the same password: Siet@123
   Example logins:
   (Username is the part before @ in email)

📊 Sample Data Created:
   - ${allMathQuestions.length} Mathematics questions
   - ${allScienceQuestions.length} Science questions
   - ${allEnglishQuestions.length} English questions
   - ${allHistoryQuestions.length} History questions
   - 4 active tests (Mathematics, Science, English, History)

🚀 You can now log in and start using the application!
    `);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }

  process.exit(0);
}

seed();
