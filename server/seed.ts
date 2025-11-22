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

    console.log(`
🎉 Seeding completed successfully!

📝 Admin Credentials:
   Username: admin
   Password: admin123
   Email: admin@srishakthi.ac.in

🚀 You can now log in and start using the application!
    `);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }

  process.exit(0);
}

seed();