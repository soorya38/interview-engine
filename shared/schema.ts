import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: text("password").notNull(), // bcrypt hashed
  role: varchar("role", { length: 50 }).notNull().default("user"), // user, admin, instructor
  fullName: text("full_name"),
  email: varchar("email", { length: 255 }),
  profileData: jsonb("profile_data").$type<{
    bio?: string;
    skills?: string[];
    experience?: string;
    education?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Topic Categories for organizing questions by subject area
export const topicCategories = pgTable("topic_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  iconName: varchar("icon_name", { length: 100 }), // for UI display
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tests table
export const tests = pgTable("tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  questionIds: jsonb("question_ids").$type<string[]>().default([]).notNull(), // array of question UUIDs
  duration: integer("duration"), // duration in minutes
  difficulty: varchar("difficulty", { length: 50 }), // easy, medium, hard
  voiceAutoSubmitTimeout: integer("voice_auto_submit_timeout").default(3000).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("test"), // test, practice
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Questions bank
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicCategoryId: uuid("topic_category_id").references(() => topicCategories.id).notNull(),
  questionText: text("question_text").notNull(),
  difficulty: varchar("difficulty", { length: 50 }).notNull(), // easy, medium, hard
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  expectedKeyPoints: jsonb("expected_key_points").$type<string[]>(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Interview sessions
export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  testId: uuid("test_id").references(() => tests.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("in_progress"), // in_progress, completed, abandoned
  currentQuestionIndex: integer("current_question_index").default(0).notNull(),
  questionIds: jsonb("question_ids").$type<string[]>().notNull(), // array of question UUIDs
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Interview turns (conversation history)
export const interviewTurns = pgTable("interview_turns", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => interviewSessions.id).notNull(),
  questionId: uuid("question_id").references(() => questions.id).notNull(),
  turnNumber: integer("turn_number").notNull(),
  userAnswer: text("user_answer").notNull(),
  aiResponse: text("ai_response").notNull(),
  evaluation: jsonb("evaluation").$type<{
    grammar: number;
    technical: number;
    depth: number;
    communication: number;
    feedback: string;
    strengths?: string[];
    areasToImprove?: string[];
    recommendations?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scores (aggregate scores per session)
export const scores = pgTable("scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => interviewSessions.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  grammarScore: integer("grammar_score").notNull(),
  technicalScore: integer("technical_score").notNull(),
  depthScore: integer("depth_score").notNull(),
  communicationScore: integer("communication_score").notNull(),
  totalScore: integer("total_score").notNull(), // weighted aggregate
  grade: varchar("grade", { length: 2 }), // A, B, C, D, F
  detailedFeedback: jsonb("detailed_feedback").$type<{
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(interviewSessions),
  scores: many(scores),
  createdTopicCategories: many(topicCategories),
  createdQuestions: many(questions),
  createdTests: many(tests),
}));

export const topicCategoriesRelations = relations(topicCategories, ({ one, many }) => ({
  creator: one(users, {
    fields: [topicCategories.createdBy],
    references: [users.id],
  }),
  questions: many(questions),
}));

export const testsRelations = relations(tests, ({ one, many }) => ({
  creator: one(users, {
    fields: [tests.createdBy],
    references: [users.id],
  }),
  sessions: many(interviewSessions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  topicCategory: one(topicCategories, {
    fields: [questions.topicCategoryId],
    references: [topicCategories.id],
  }),
  creator: one(users, {
    fields: [questions.createdBy],
    references: [users.id],
  }),
  turns: many(interviewTurns),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [interviewSessions.userId],
    references: [users.id],
  }),
  test: one(tests, {
    fields: [interviewSessions.testId],
    references: [tests.id],
  }),
  turns: many(interviewTurns),
  score: one(scores),
}));

export const interviewTurnsRelations = relations(interviewTurns, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [interviewTurns.sessionId],
    references: [interviewSessions.id],
  }),
  question: one(questions, {
    fields: [interviewTurns.questionId],
    references: [questions.id],
  }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [scores.sessionId],
    references: [interviewSessions.id],
  }),
  user: one(users, {
    fields: [scores.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export const insertTopicCategorySchema = createInsertSchema(topicCategories).omit({
  id: true,
  createdAt: true,
});

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
}).extend({
  questionIds: z.array(z.string()).optional(),
  type: z.enum(["test", "practice"]).default("test"),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({
  id: true,
  startedAt: true,
});

export const insertInterviewTurnSchema = createInsertSchema(interviewTurns).omit({
  id: true,
  createdAt: true,
});

export const insertScoreSchema = createInsertSchema(scores).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTopicCategory = z.infer<typeof insertTopicCategorySchema>;
export type TopicCategory = typeof topicCategories.$inferSelect;

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewSession = typeof interviewSessions.$inferSelect;

export type InsertInterviewTurn = z.infer<typeof insertInterviewTurnSchema>;
export type InterviewTurn = typeof interviewTurns.$inferSelect;

export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Update profile schema (for users to update their own profile)
export const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  profileData: z.object({
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.string().optional(),
    education: z.string().optional(),
  }).optional(),
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;
