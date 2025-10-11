// Based on javascript_database blueprint with expanded interface
import {
  users,
  topics,
  questions,
  interviewSessions,
  interviewTurns,
  scores,
  type User,
  type InsertUser,
  type Topic,
  type InsertTopic,
  type Question,
  type InsertQuestion,
  type InterviewSession,
  type InsertInterviewSession,
  type InterviewTurn,
  type InsertInterviewTurn,
  type Score,
  type InsertScore,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Topics
  getTopic(id: string): Promise<Topic | undefined>;
  getAllTopics(): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, topic: Partial<InsertTopic>): Promise<Topic | undefined>;
  deleteTopic(id: string): Promise<void>;

  // Questions
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByTopic(topicId: string): Promise<Question[]>;
  getAllQuestions(): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<void>;

  // Interview Sessions
  getSession(id: string): Promise<InterviewSession | undefined>;
  getUserSessions(userId: string): Promise<InterviewSession[]>;
  createSession(session: InsertInterviewSession): Promise<InterviewSession>;
  updateSession(id: string, session: Partial<InsertInterviewSession>): Promise<InterviewSession | undefined>;

  // Interview Turns
  getSessionTurns(sessionId: string): Promise<InterviewTurn[]>;
  createTurn(turn: InsertInterviewTurn): Promise<InterviewTurn>;

  // Scores
  getScore(sessionId: string): Promise<Score | undefined>;
  getUserScores(userId: string): Promise<Score[]>;
  createScore(score: InsertScore): Promise<Score>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values([insertUser]).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Topics
  async getTopic(id: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic || undefined;
  }

  async getAllTopics(): Promise<Topic[]> {
    return await db.select().from(topics).orderBy(desc(topics.createdAt));
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const [topic] = await db.insert(topics).values([insertTopic]).returning();
    return topic;
  }

  async updateTopic(id: string, updateData: Partial<InsertTopic>): Promise<Topic | undefined> {
    const [topic] = await db.update(topics).set(updateData).where(eq(topics.id, id)).returning();
    return topic || undefined;
  }

  async deleteTopic(id: string): Promise<void> {
    await db.delete(topics).where(eq(topics.id, id));
  }

  // Questions
  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.topicId, topicId)).orderBy(desc(questions.createdAt));
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db.select().from(questions).orderBy(desc(questions.createdAt));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values([insertQuestion]).returning();
    return question;
  }

  async updateQuestion(id: string, updateData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [question] = await db.update(questions).set(updateData).where(eq(questions.id, id)).returning();
    return question || undefined;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Interview Sessions
  async getSession(id: string): Promise<InterviewSession | undefined> {
    const [session] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id));
    return session || undefined;
  }

  async getUserSessions(userId: string): Promise<InterviewSession[]> {
    return await db.select().from(interviewSessions).where(eq(interviewSessions.userId, userId)).orderBy(desc(interviewSessions.startedAt));
  }

  async createSession(insertSession: InsertInterviewSession): Promise<InterviewSession> {
    const [session] = await db.insert(interviewSessions).values([insertSession]).returning();
    return session;
  }

  async updateSession(id: string, updateData: Partial<InsertInterviewSession>): Promise<InterviewSession | undefined> {
    const [session] = await db.update(interviewSessions).set(updateData).where(eq(interviewSessions.id, id)).returning();
    return session || undefined;
  }

  // Interview Turns
  async getSessionTurns(sessionId: string): Promise<InterviewTurn[]> {
    return await db.select().from(interviewTurns).where(eq(interviewTurns.sessionId, sessionId)).orderBy(interviewTurns.turnNumber);
  }

  async createTurn(insertTurn: InsertInterviewTurn): Promise<InterviewTurn> {
    const [turn] = await db.insert(interviewTurns).values([insertTurn]).returning();
    return turn;
  }

  // Scores
  async getScore(sessionId: string): Promise<Score | undefined> {
    const [score] = await db.select().from(scores).where(eq(scores.sessionId, sessionId));
    return score || undefined;
  }

  async getUserScores(userId: string): Promise<Score[]> {
    return await db.select().from(scores).where(eq(scores.userId, userId)).orderBy(desc(scores.createdAt));
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    const [score] = await db.insert(scores).values([insertScore]).returning();
    return score;
  }
}

export const storage = new DatabaseStorage();
