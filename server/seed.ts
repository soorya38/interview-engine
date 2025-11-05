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
        email: "admin@srishakthi.ac.in",
      })
      .returning();

    console.log("✅ Created admin user:", admin.username);

    // Create all student users with password "Siet@123"
    const studentPassword = await hashPassword("Siet@123");
    const studentEmails = [
      "ramalingamm22ece@srishakthi.ac.in",
      "gowthamg22cys@srishakthi.ac.in",
      "kesavans22cys@srishakthi.ac.in",
      "noorafikjalaludeena22ads@srishakthi.ac.in",
      "rishir22ads@srishakthi.ac.in",
      "sivraamkrishnankv22ads@srishakthi.ac.in",
      "varuns22ads@srishakthi.ac.in",
      "deepakt22aml@srishakthi.ac.in",
      "prakashdassr22aml@srishakthi.ac.in",
      "abdulgousea22it@srishakthi.ac.in",
      "ancyjemigoldbellp22cse@srishakthi.ac.in",
      "mohammedasani22cse@srishakthi.ac.in",
      "vishwar22cse@srishakthi.ac.in",
      "yasinmalikj22ece@srishakthi.ac.in",
      "ajaykumarjs22cys@srishakthi.ac.in",
      "mohamedrafill22ads@srishakthi.ac.in",
      "kirthikaamk22aml@srishakthi.ac.in",
      "sanjeevikumarm22aml@srishakthi.ac.in",
      "deeksheethn22it@srishakthi.ac.in",
      "matheshm22it@srishakthi.ac.in",
      "ponnarasua22it@srishakthi.ac.in",
      "tharanil22cse@srishakthi.ac.in",
      "dhivanans22eee@srishakthi.ac.in",
      "maheshkumaark22ads@srishakthi.ac.in",
      "mohammedasathk22ads@srishakthi.ac.in",
      "karthikadevim22it@srishakthi.ac.in",
      "mervinj22it@srishakthi.ac.in",
      "madhang22ece@srishakthi.ac.in",
      "sriramm22ece@srishakthi.ac.in",
      "yuvankrishnap22cys@srishakthi.ac.in",
      "harishj22ads@srishakthi.ac.in",
      "harishp22ads@srishakthi.ac.in",
      "bharathg22aml@srishakthi.ac.in",
      "harinivasm22aml@srishakthi.ac.in",
      "harshadd22aml@srishakthi.ac.in",
      "dilipkumarn22it@srishakthi.ac.in",
      "sivadharshinin22cse@srishakthi.ac.in",
      "thulasikishorep22cse@srishakthi.ac.in",
      "ridhinyab22ads@srishakthi.ac.in",
      "ravichandranr22aml@srishakthi.ac.in",
      "dharshand22it@srishakthi.ac.in",
      "prabincs22cse@srishakthi.ac.in",
      "saieshcb22cse@srishakthi.ac.in",
      "dineshkumargm22ads@srishakthi.ac.in",
      "seemamaglins22ads@srishakthi.ac.in",
      "krishnant22aml@srishakthi.ac.in",
      "robinanburajb22aml@srishakthi.ac.in",
      "suryar22cse@srishakthi.ac.in",
      "venyabalab22cse@srishakthi.ac.in",
      "edwinrajaa22cys@srishakthi.ac.in",
      "shanjaiysb22cys@srishakthi.ac.in",
      "deepikas22ads@srishakthi.ac.in",
      "nihasb22ads@srishakthi.ac.in",
      "divyaprabhag22it@srishakthi.ac.in",
      "magibalans22it@srishakthi.ac.in",
      "sanjayr22cse@srishakthi.ac.in",
      "balupiraveenk22ece@srishakthi.ac.in",
      "mohammedakmals22cys@srishakthi.ac.in",
      "vishwanathasriramm22cys@srishakthi.ac.in",
      "meenup22ads@srishakthi.ac.in",
      "naveenkumarj22ads@srishakthi.ac.in",
      "sarayumam22ads@srishakthi.ac.in",
      "rahulrn22aml@srishakthi.ac.in",
      "shasaankg22aml@srishakthi.ac.in",
      "harishk22it@srishakthi.ac.in",
      "tharunm22eee@srishakthi.ac.in",
      "saranprakashr22ads@srishakthi.ac.in",
      "harisshks22cse@srishakthi.ac.in",
      "rohithu22cse@srishakthi.ac.in",
      "abigurug22ece@srishakthi.ac.in",
      "anandhithac22ece@srishakthi.ac.in",
      "anushnu22cys@srishakthi.ac.in",
      "jeevak22cys@srishakthi.ac.in",
      "Karthickb22ads@srishakthi.ac.in",
      "shikhasrinivas22ads@srishakthi.ac.in",
      "snehalaanandkumar22aml@srishakthi.ac.in",
      "meenaumadevim22it@srishakthi.ac.in",
      "janarthana22ece@srishakthi.ac.in",
      "pavithran22ece@srishakthi.ac.in",
      "raghulkrishnac22ece@srishakthi.ac.in",
      "albintenny22cys@srishakthi.ac.in",
      "narendranav22cys@srishakthi.ac.in",
      "monishv22aml@srishakthi.ac.in",
      "sweathaj22aml@srishakthi.ac.in",
      "adithyars22cse@srishakthi.ac.in",
      "bhavishnus22cse@srishakthi.ac.in",
      "shalinis22cse@srishakthi.ac.in",
      "sridhars22cse@srishakthi.ac.in",
      "karthikeyanscse@srishakthi.ac.in",
      "nirmalmuraris22ece@srishakthi.ac.in",
      "nithishkumarvv22ece@srishakthi.ac.in",
      "nivethav22cse@srishakthi.ac.in",
      "thirukumaranyuvaraj22cys@srishakthi.ac.in",
      "sandhyav22ads@srishakthi.ac.in",
      "sibis22aml@srishakthi.ac.in",
      "abinayas22it@srishakthi.ac.in",
      "kumarans22it@srishakthi.ac.in",
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

    console.log(`✅ Created ${studentUsers.length} student users`);

    // Create topic categories
    const [javaTopicCategory] = await db
      .insert(topicCategories)
      .values({
        name: "Java",
        description: "Java programming fundamentals and concepts",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    const [pythonTopicCategory] = await db
      .insert(topicCategories)
      .values({
        name: "Python",
        description: "Python programming fundamentals and concepts",
        iconName: "BookOpen",
        createdBy: admin.id,
      })
      .returning();

    console.log("✅ Created topic categories: Java, Python");

    // Create Java questions
    const javaQuestions = [
      {
        questionText: "Which company owns Java now and what is the latest version?",
        difficulty: "easy" as const,
        expectedKeyPoints: ["Oracle", "version", "ownership"],
      },
      {
        questionText: "What are the 2 steps in Java compilation. Explain the 2 steps",
        difficulty: "medium" as const,
        expectedKeyPoints: ["compile", "bytecode", "execution"],
      },
      {
        questionText: "Explain the difference between Java compiler & Interpreter",
        difficulty: "medium" as const,
        expectedKeyPoints: ["compiler", "interpreter", "bytecode", "machine code"],
      },
      {
        questionText: "Is JVM platform independent?",
        difficulty: "easy" as const,
        expectedKeyPoints: ["JVM", "platform dependent", "platform independent"],
      },
      {
        questionText: "How does java ensure portability",
        difficulty: "medium" as const,
        expectedKeyPoints: ["bytecode", "JVM", "platform independent"],
      },
      {
        questionText: "Explain JVM, JRE, JDK",
        difficulty: "medium" as const,
        expectedKeyPoints: ["JVM", "JRE", "JDK", "relationship"],
      },
      {
        questionText: "What is a class loader? What is its purpose?",
        difficulty: "medium" as const,
        expectedKeyPoints: ["class loader", "loading", "classes", "runtime"],
      },
      {
        questionText: "Explain each word public static void main(String[] args)",
        difficulty: "medium" as const,
        expectedKeyPoints: ["public", "static", "void", "main", "String array"],
      },
      {
        questionText: "What is meant by a package in Java?",
        difficulty: "easy" as const,
        expectedKeyPoints: ["package", "namespace", "organization", "classes"],
      },
      {
        questionText: "When an object is created, is the memory allocated in stack or heap?",
        difficulty: "easy" as const,
        expectedKeyPoints: ["heap", "object", "memory allocation"],
      },
      {
        questionText: "What is Java String pool?",
        difficulty: "medium" as const,
        expectedKeyPoints: ["String pool", "memory", "optimization", "strings"],
      },
    ];

    await db.insert(questions).values(
      javaQuestions.map((q) => ({
        topicCategoryId: javaTopicCategory.id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        expectedKeyPoints: q.expectedKeyPoints,
        createdBy: admin.id,
      }))
    );

    console.log(`✅ Created ${javaQuestions.length} Java questions`);

    // Create Python questions
    const pythonQuestions = [
      {
        questionText: "What is list comprehension? Give an example",
        difficulty: "medium" as const,
        expectedKeyPoints: ["list comprehension", "syntax", "example", "iteration"],
      },
      {
        questionText: "What happens when you assign list2 = list1?",
        difficulty: "easy" as const,
        expectedKeyPoints: ["reference", "shallow copy", "same object"],
      },
      {
        questionText: "Explain slicing function in python",
        difficulty: "easy" as const,
        expectedKeyPoints: ["slicing", "syntax", "start", "stop", "step"],
      },
      {
        questionText: "What is the difference between a list and a dictionary",
        difficulty: "easy" as const,
        expectedKeyPoints: ["list", "dictionary", "key-value", "ordered"],
      },
      {
        questionText: "What is the use of pass statement in python. Give an example",
        difficulty: "easy" as const,
        expectedKeyPoints: ["pass", "placeholder", "null operation", "example"],
      },
      {
        questionText: "How is exception handling done in python",
        difficulty: "medium" as const,
        expectedKeyPoints: ["try", "except", "exception handling", "finally"],
      },
      {
        questionText: "What is a lambda function? Give an example",
        difficulty: "medium" as const,
        expectedKeyPoints: ["lambda", "anonymous function", "syntax", "example"],
      },
      {
        questionText: "How are arguments passed to functions - by value or by reference in Python?",
        difficulty: "medium" as const,
        expectedKeyPoints: ["pass by reference", "pass by value", "object reference"],
      },
      {
        questionText: "Can we pass a function as an argument in python? Give an example",
        difficulty: "medium" as const,
        expectedKeyPoints: ["first-class function", "higher-order function", "example"],
      },
      {
        questionText: "Explain try except block in python with an example",
        difficulty: "medium" as const,
        expectedKeyPoints: ["try", "except", "exception", "example", "error handling"],
      },
      {
        questionText: "What are the different variable scopes in python",
        difficulty: "medium" as const,
        expectedKeyPoints: ["local", "global", "nonlocal", "scope"],
      },
    ];

    await db.insert(questions).values(
      pythonQuestions.map((q) => ({
        topicCategoryId: pythonTopicCategory.id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        expectedKeyPoints: q.expectedKeyPoints,
        createdBy: admin.id,
      }))
    );

    console.log(`✅ Created ${pythonQuestions.length} Python questions`);

    // Get all questions for creating tests
    const allJavaQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.topicCategoryId, javaTopicCategory.id));
    
    const allPythonQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.topicCategoryId, pythonTopicCategory.id));

    // Create tests
    const [javaTest] = await db
      .insert(tests)
      .values({
        name: "Java Fundamentals Test",
        description: "Comprehensive Java programming assessment covering core concepts",
        questionIds: allJavaQuestions.map((q) => q.id),
        duration: 60,
        difficulty: "mixed",
        isActive: true,
        createdBy: admin.id,
      })
      .returning();

    const [pythonTest] = await db
      .insert(tests)
      .values({
        name: "Python Fundamentals Test",
        description: "Comprehensive Python programming assessment covering core concepts",
        questionIds: allPythonQuestions.map((q) => q.id),
        duration: 60,
        difficulty: "mixed",
        isActive: true,
        createdBy: admin.id,
      })
      .returning();

    console.log("✅ Created Java and Python tests");

    console.log(`
🎉 Seeding completed successfully!

📝 Admin Credentials:
   Username: admin
   Password: admin123
   Email: admin@srishakthi.ac.in

📝 Student Credentials:
   Total Students: ${studentUsers.length}
   All students have the same password: Siet@123
   Example logins:
   - ramalingamm22ece / Siet@123
   - gowthamg22cys / Siet@123
   - kesavans22cys / Siet@123
   (Username is the part before @ in email)

📊 Sample Data Created:
   - ${allJavaQuestions.length} Java questions
   - ${allPythonQuestions.length} Python questions
   - 2 active tests (Java and Python)

🚀 You can now log in and start using the application!
    `);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }

  process.exit(0);
}

seed();