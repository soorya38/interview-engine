
import { db } from "../server/db";
import { users, topicCategories, questions, tests } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
    console.log("Seeding test data...");

    // 1. Create Regular User (if not exists)
    const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, "regularuser"),
    });

    let userId;
    if (!existingUser) {
        const hashedPassword = await hashPassword("password123");
        const [user] = await db.insert(users).values({
            username: "regularuser",
            password: hashedPassword,
            role: "user", // Explicitly set as user
            fullName: "Regular User",
        }).returning();
        userId = user.id;
        console.log("Created regular user:", userId);
    } else {
        userId = existingUser.id;
        console.log("Using existing regular user:", userId);
    }

    // 2. Create Admin User (for creating content)
    const existingAdmin = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, "adminuser"),
    });

    let adminId;
    if (!existingAdmin) {
        const hashedPassword = await hashPassword("password123");
        const [admin] = await db.insert(users).values({
            username: "adminuser",
            password: hashedPassword,
            role: "admin",
            fullName: "Admin User",
        }).returning();
        adminId = admin.id;
        console.log("Created admin user:", adminId);
    } else {
        adminId = existingAdmin.id;
        console.log("Using existing admin user:", adminId);
    }

    // 3. Create Topic Category
    const [category] = await db.insert(topicCategories).values({
        name: "General Interview",
        description: "General interview questions",
        createdBy: adminId,
    }).returning();
    console.log("Created category:", category.id);

    // 4. Create Question
    const [question] = await db.insert(questions).values({
        topicCategoryId: category.id,
        questionText: "Tell me about yourself.",
        difficulty: "easy",
        createdBy: adminId,
    }).returning();
    console.log("Created question:", question.id);

    // 5. Create Test
    const [test] = await db.insert(tests).values({
        name: "UI Verification Test",
        description: "Test for verifying UI changes",
        questionIds: [question.id],
        duration: 30,
        difficulty: "easy",
        voiceAutoSubmitTimeout: 3000,
        createdBy: adminId,
    }).returning();
    console.log("Created test:", test.id);

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
