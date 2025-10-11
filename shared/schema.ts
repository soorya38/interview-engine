import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, uuid, jsonb } from "drizzle-orm/pg-core";
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

// Topics for interview categories
export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  iconName: varchar("icon_name", { length: 100 }), // for UI display
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Questions bank
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id").references(() => topics.id).notNull(),
  questionText: text("question_text").notNull(),
  difficulty: varchar("difficulty", { length: 50 }).notNull(), // easy, medium, hard
  expectedKeyPoints: jsonb("expected_key_points").$type<string[]>(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Interview sessions
export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  topicId: uuid("topic_id").references(() => topics.id).notNull(),
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
  createdTopics: many(topics),
  createdQuestions: many(questions),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  creator: one(users, {
    fields: [topics.createdBy],
    references: [users.id],
  }),
  questions: many(questions),
  sessions: many(interviewSessions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
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
  topic: one(topics, {
    fields: [interviewSessions.topicId],
    references: [topics.id],
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

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
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

export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

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
