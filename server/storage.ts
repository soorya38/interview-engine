// Based on javascript_database blueprint with expanded interface
import {
  users,
  topicCategories,
  tests,
  questions,
  interviewSessions,
  interviewTurns,
  scores,
  type User,
  type InsertUser,
  type TopicCategory,
  type InsertTopicCategory,
  type Test,
  type InsertTest,
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
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Topic Categories
  getTopicCategory(id: string): Promise<TopicCategory | undefined>;
  getAllTopicCategories(): Promise<TopicCategory[]>;
  createTopicCategory(topicCategory: InsertTopicCategory): Promise<TopicCategory>;
  updateTopicCategory(id: string, topicCategory: Partial<InsertTopicCategory>): Promise<TopicCategory | undefined>;
  deleteTopicCategory(id: string): Promise<void>;

  // Tests
  getTest(id: string): Promise<Test | undefined>;
  getAllTests(): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: string, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: string): Promise<void>;

  // Questions
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByTopicCategory(topicCategoryId: string): Promise<Question[]>;
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

  // Admin
  getPaginatedStudentSessions(page: number, limit: number): Promise<{ sessions: any[], total: number }>;
  getAdminAnalytics(): Promise<any>;
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
    const [user] = await db.insert(users).values([insertUser as any]).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData as any).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Topic Categories
  async getTopicCategory(id: string): Promise<TopicCategory | undefined> {
    const [topicCategory] = await db.select().from(topicCategories).where(eq(topicCategories.id, id));
    return topicCategory || undefined;
  }

  async getAllTopicCategories(): Promise<TopicCategory[]> {
    return await db.select().from(topicCategories).orderBy(desc(topicCategories.createdAt));
  }

  async createTopicCategory(insertTopicCategory: InsertTopicCategory): Promise<TopicCategory> {
    const [topicCategory] = await db.insert(topicCategories).values([insertTopicCategory as any]).returning();
    return topicCategory;
  }

  async updateTopicCategory(id: string, updateData: Partial<InsertTopicCategory>): Promise<TopicCategory | undefined> {
    const [topicCategory] = await db.update(topicCategories).set(updateData as any).where(eq(topicCategories.id, id)).returning();
    return topicCategory || undefined;
  }

  async deleteTopicCategory(id: string): Promise<void> {
    await db.delete(topicCategories).where(eq(topicCategories.id, id));
  }

  // Tests
  async getTest(id: string): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test || undefined;
  }

  async getAllTests(): Promise<Test[]> {
    return await db.select().from(tests).orderBy(desc(tests.createdAt));
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const [test] = await db.insert(tests).values([insertTest as any]).returning();
    return test;
  }

  async updateTest(id: string, updateData: Partial<InsertTest>): Promise<Test | undefined> {
    const [test] = await db.update(tests).set(updateData as any).where(eq(tests.id, id)).returning();
    return test || undefined;
  }

  async deleteTest(id: string): Promise<void> {
    await db.delete(tests).where(eq(tests.id, id));
  }

  // Questions
  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async getQuestionsByTopicCategory(topicCategoryId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.topicCategoryId, topicCategoryId)).orderBy(desc(questions.createdAt));
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db.select().from(questions).orderBy(desc(questions.createdAt));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values([insertQuestion as any]).returning();
    return question;
  }

  async updateQuestion(id: string, updateData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [question] = await db.update(questions).set(updateData as any).where(eq(questions.id, id)).returning();
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
    const [session] = await db.insert(interviewSessions).values([insertSession as any]).returning();
    return session;
  }

  async updateSession(id: string, updateData: Partial<InsertInterviewSession>): Promise<InterviewSession | undefined> {
    const [session] = await db.update(interviewSessions).set(updateData as any).where(eq(interviewSessions.id, id)).returning();
    return session || undefined;
  }

  // Interview Turns
  async getSessionTurns(sessionId: string): Promise<InterviewTurn[]> {
    return await db.select().from(interviewTurns).where(eq(interviewTurns.sessionId, sessionId)).orderBy(interviewTurns.turnNumber);
  }

  async createTurn(insertTurn: InsertInterviewTurn): Promise<InterviewTurn> {
    const [turn] = await db.insert(interviewTurns).values([insertTurn as any]).returning();
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
    const [score] = await db.insert(scores).values([insertScore as any]).returning();
    return score;
  }

  // Admin
  async getPaginatedStudentSessions(page: number, limit: number): Promise<{ sessions: any[], total: number }> {
    const offset = (page - 1) * limit;

    const sessionsQuery = await db.select({
      session: interviewSessions,
      user: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
      },
      testName: tests.name,
      score: scores,
      questionCount: sql<number>`(SELECT COUNT(*) FROM ${interviewTurns} WHERE ${interviewTurns.sessionId} = ${interviewSessions.id})`,
      totalQuestions: sql<number>`jsonb_array_length(${interviewSessions.questionIds})`,
    })
      .from(interviewSessions)
      .innerJoin(users, eq(interviewSessions.userId, users.id))
      .leftJoin(tests, eq(interviewSessions.testId, tests.id))
      .leftJoin(scores, eq(interviewSessions.id, scores.sessionId))
      .where(eq(interviewSessions.status, "completed"))
      .orderBy(desc(interviewSessions.completedAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db.select({ count: count() })
      .from(interviewSessions)
      .where(eq(interviewSessions.status, "completed"));

    const formattedSessions = sessionsQuery.map(item => ({
      ...item.session,
      user: item.user,
      testName: item.testName,
      score: item.score,
      questionCount: item.questionCount,
      totalQuestions: item.totalQuestions,
    }));

    return {
      sessions: formattedSessions,
      total: totalResult?.count || 0,
    };
  }

  async getAdminAnalytics(): Promise<any> {
    const [totalSessions] = await db.select({ count: count() })
      .from(interviewSessions)
      .where(eq(interviewSessions.status, "completed"));

    const [totalUsers] = await db.select({ count: count() })
      .from(users);

    // Active users (users who have completed at least one test)
    const [activeUsers] = await db.select({ count: count(sql`DISTINCT ${interviewSessions.userId}`) })
      .from(interviewSessions)
      .where(eq(interviewSessions.status, "completed"));

    // Average scores
    const [avgScores] = await db.select({
      grammar: sql<number>`AVG(${scores.grammarScore})`,
      technical: sql<number>`AVG(${scores.technicalScore})`,
      depth: sql<number>`AVG(${scores.depthScore})`,
      communication: sql<number>`AVG(${scores.communicationScore})`,
      total: sql<number>`AVG(${scores.totalScore})`,
    }).from(scores);

    // Grade distribution
    const gradeDistribution = await db.select({
      grade: scores.grade,
      count: count(),
    })
      .from(scores)
      .groupBy(scores.grade);

    const gradeDistMap = {
      A: 0, B: 0, C: 0, D: 0, F: 0
    };
    gradeDistribution.forEach((g) => {
      if (g.grade && g.grade in gradeDistMap) {
        gradeDistMap[g.grade as keyof typeof gradeDistMap] = g.count;
      }
    });

    // Sessions by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessionsByDay = await db.select({
      date: sql<string>`DATE(${interviewSessions.completedAt})`,
      count: count(),
    })
      .from(interviewSessions)
      .where(and(
        eq(interviewSessions.status, "completed"),
        sql`${interviewSessions.completedAt} >= ${thirtyDaysAgo.toISOString()}`
      ))
      .groupBy(sql`DATE(${interviewSessions.completedAt})`);

    const sessionsByDayMap: Record<string, number> = {};
    sessionsByDay.forEach((s) => {
      sessionsByDayMap[s.date] = s.count;
    });

    return {
      totalSessions: totalSessions?.count || 0,
      totalUsers: totalUsers?.count || 0,
      activeUsers: activeUsers?.count || 0,
      averageScores: {
        grammar: Math.round(Number(avgScores?.grammar || 0)),
        technical: Math.round(Number(avgScores?.technical || 0)),
        depth: Math.round(Number(avgScores?.depth || 0)),
        communication: Math.round(Number(avgScores?.communication || 0)),
        total: Math.round(Number(avgScores?.total || 0)),
      },
      gradeDistribution: gradeDistMap,
      sessionsByDay: sessionsByDayMap,
    };
  }
}

export const storage = new DatabaseStorage();
