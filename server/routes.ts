import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, verifyToken, type JWTPayload } from "./auth";
import { conductInterview, calculateTotalScore, getGrade } from "./gemini";
import { loginSchema, insertUserSchema, insertTopicCategorySchema, insertTestSchema, insertQuestionSchema, updateProfileSchema } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Auth middleware
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = payload;
  next();
}

// Admin/Instructor middleware
function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "instructor")) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      
      // Check if username exists
      const existing = await storage.getUserByUsername(validated.username);
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validated.password);
      const user = await storage.createUser({
        ...validated,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(user);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(validated.username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(validated.password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Topic Categories routes
  app.get("/api/topic-categories", authMiddleware, async (req, res) => {
    try {
      const allTopicCategories = await storage.getAllTopicCategories();
      
      // Get all users once to avoid N+1 queries
      const allUsers = await storage.getAllUsers();
      const adminUserIds = new Set(
        allUsers
          .filter((user) => user.role === 'admin' || user.role === 'instructor')
          .map((user) => user.id)
      );
      
      // Filter topic categories to only show those created by admin/instructor users
      const topicCategories = allTopicCategories.filter((topicCategory) => 
        topicCategory.createdBy && adminUserIds.has(topicCategory.createdBy)
      );
      
      // Add question count for each topic category
      const topicCategoriesWithCounts = await Promise.all(
        topicCategories.map(async (topicCategory) => {
          const questions = await storage.getQuestionsByTopicCategory(topicCategory.id);
          return { ...topicCategory, questionCount: questions.length };
        })
      );

      res.json(topicCategoriesWithCounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/topic-categories", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validated = insertTopicCategorySchema.parse(req.body);
      const topicCategory = await storage.createTopicCategory({
        ...validated,
        createdBy: req.user!.userId,
      });
      res.json(topicCategory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/topic-categories/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validated = insertTopicCategorySchema.partial().parse(req.body);
      const topicCategory = await storage.updateTopicCategory(req.params.id, validated);
      if (!topicCategory) {
        return res.status(404).json({ error: "Topic category not found" });
      }
      res.json(topicCategory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/topic-categories/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await storage.deleteTopicCategory(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Tests routes
  app.get("/api/tests", authMiddleware, async (req, res) => {
    try {
      const allTests = await storage.getAllTests();
      
      // Get all users once to avoid N+1 queries
      const allUsers = await storage.getAllUsers();
      const adminUserIds = new Set(
        allUsers
          .filter((user) => user.role === 'admin' || user.role === 'instructor')
          .map((user) => user.id)
      );
      
      // Filter tests to only show those created by admin/instructor users
      const tests = allTests.filter((test) => 
        test.createdBy && adminUserIds.has(test.createdBy)
      );
      
      // Add question count for each test
      const testsWithCounts = await Promise.all(
        tests.map(async (test) => {
          const questionCount = test.questionIds?.length || 0;
          return { ...test, questionCount };
        })
      );

      res.json(testsWithCounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tests", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validated = insertTestSchema.parse(req.body);
      const test = await storage.createTest({
        ...validated,
        createdBy: req.user!.userId,
      });
      res.json(test);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/tests/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validated = insertTestSchema.partial().parse(req.body);
      const test = await storage.updateTest(req.params.id, validated);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.json(test);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tests/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await storage.deleteTest(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Questions routes
  app.get("/api/questions", authMiddleware, async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      
      // Add topic category name to each question
      const questionsWithTopicCategories = await Promise.all(
        questions.map(async (question) => {
          const topicCategory = await storage.getTopicCategory(question.topicCategoryId);
          return { ...question, topicCategoryName: topicCategory?.name };
        })
      );

      res.json(questionsWithTopicCategories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/questions", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validated = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion({
        ...validated,
        createdBy: req.user!.userId,
      });
      res.json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/questions/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validated = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(req.params.id, validated);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/questions/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Users routes
  app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Interview session routes
  app.post("/api/sessions/start", authMiddleware, async (req, res) => {
    try {
      const { testId } = req.body;

      if (!testId) {
        return res.status(400).json({ error: "Test ID required" });
      }

      // Get test with its questionIds
      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      if (!test.questionIds || test.questionIds.length === 0) {
        return res.status(400).json({ error: "No questions available for this test" });
      }

      // Create session with the questions defined in the test
      const session = await storage.createSession({
        userId: req.user!.userId,
        testId,
        questionIds: test.questionIds,
        currentQuestionIndex: 0,
        status: "in_progress",
      });

      // Get the first question for the response
      const firstQuestion = await storage.getQuestion(test.questionIds[0]);
      res.json({ session, currentQuestion: firstQuestion });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sessions/recent", authMiddleware, async (req, res) => {
    try {
      const sessions = await storage.getUserSessions(req.user!.userId);
      
      // Filter only completed sessions and limit to 5 for dashboard
      const completedSessions = sessions.filter(s => s.status === "completed");
      
      const sessionsWithDetails = await Promise.all(
        completedSessions.slice(0, 5).map(async (session) => {
          const test = await storage.getTest(session.testId);
          const score = await storage.getScore(session.id);
          return {
            ...session,
            testName: test?.name,
            score,
          };
        })
      );

      res.json(sessionsWithDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sessions/history", authMiddleware, async (req, res) => {
    try {
      const sessions = await storage.getUserSessions(req.user!.userId);
      
      // Get all completed sessions for history page
      const completedSessions = sessions.filter(s => s.status === "completed");
      
      const sessionsWithDetails = await Promise.all(
        completedSessions.map(async (session) => {
          const test = await storage.getTest(session.testId);
          const score = await storage.getScore(session.id);
          return {
            ...session,
            testName: test?.name,
            score,
          };
        })
      );

      res.json(sessionsWithDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sessions/:id", authMiddleware, async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.userId !== req.user!.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const turns = await storage.getSessionTurns(session.id);
      const currentQuestion = await storage.getQuestion(session.questionIds[session.currentQuestionIndex]);

      res.json({
        ...session,
        turns,
        currentQuestion,
        totalQuestions: session.questionIds.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sessions/answer", authMiddleware, async (req, res) => {
    try {
      const { sessionId, answer } = req.body;

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.userId !== req.user!.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const currentQuestion = await storage.getQuestion(session.questionIds[session.currentQuestionIndex]);
      if (!currentQuestion) {
        return res.status(400).json({ error: "Question not found" });
      }

      // Get user's past scores for context
      const userScores = await storage.getUserScores(req.user!.userId);
      const pastScores = userScores.map((s) => s.totalScore);

      // Conduct AI interview evaluation
      const evaluation = await conductInterview(
        currentQuestion.questionText,
        answer,
        {
          username: req.user!.username,
          pastScores,
        }
      );

      // Save turn
      const turnNumber = session.currentQuestionIndex;
      const turn = await storage.createTurn({
        sessionId: session.id,
        questionId: currentQuestion.id,
        turnNumber,
        userAnswer: answer,
        aiResponse: evaluation.interviewer_text,
        evaluation: {
          grammar: evaluation.grammar,
          technical: evaluation.technical,
          depth: evaluation.depth,
          communication: evaluation.communication,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          areasToImprove: evaluation.areasToImprove,
          recommendations: evaluation.recommendations,
        },
      });

      // Check if interview is complete
      const nextQuestionIndex = session.currentQuestionIndex + 1;
      const isComplete = nextQuestionIndex >= session.questionIds.length;

      if (isComplete) {
        // Calculate final scores
        const allTurns = await storage.getSessionTurns(session.id);
        
        const avgGrammar = Math.round(
          allTurns.reduce((sum, t) => sum + (t.evaluation?.grammar || 0), 0) / allTurns.length
        );
        const avgTechnical = Math.round(
          allTurns.reduce((sum, t) => sum + (t.evaluation?.technical || 0), 0) / allTurns.length
        );
        const avgDepth = Math.round(
          allTurns.reduce((sum, t) => sum + (t.evaluation?.depth || 0), 0) / allTurns.length
        );
        const avgCommunication = Math.round(
          allTurns.reduce((sum, t) => sum + (t.evaluation?.communication || 0), 0) / allTurns.length
        );

        const totalScore = calculateTotalScore({
          grammar: avgGrammar,
          technical: avgTechnical,
          depth: avgDepth,
          communication: avgCommunication,
        });

        const grade = getGrade(totalScore);

        // Aggregate feedback from all turns
        const allStrengths: string[] = [];
        const allImprovements: string[] = [];
        const allRecommendations: string[] = [];

        allTurns.forEach(turn => {
          if (turn.evaluation?.strengths) {
            allStrengths.push(...turn.evaluation.strengths);
          }
          if (turn.evaluation?.areasToImprove) {
            allImprovements.push(...turn.evaluation.areasToImprove);
          }
          if (turn.evaluation?.recommendations) {
            allRecommendations.push(...turn.evaluation.recommendations);
          }
        });

        // Remove duplicates and take top items
        const strengths = Array.from(new Set(allStrengths)).slice(0, 5);
        const improvements = Array.from(new Set(allImprovements)).slice(0, 5);
        const recommendations = Array.from(new Set(allRecommendations)).slice(0, 5);

        const score = await storage.createScore({
          sessionId: session.id,
          userId: req.user!.userId,
          grammarScore: avgGrammar,
          technicalScore: avgTechnical,
          depthScore: avgDepth,
          communicationScore: avgCommunication,
          totalScore,
          grade,
          detailedFeedback: {
            strengths,
            improvements,
            recommendations,
          },
        });

        await storage.updateSession(session.id, {
          status: "completed",
          completedAt: new Date(),
        });

        res.json({ turn, completed: true, score });
      } else {
        await storage.updateSession(session.id, {
          currentQuestionIndex: nextQuestionIndex,
        });

        const nextQuestion = await storage.getQuestion(session.questionIds[nextQuestionIndex]);
        res.json({ turn, completed: false, nextQuestion });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sessions/:id/score", authMiddleware, async (req, res) => {
    try {
      const score = await storage.getScore(req.params.id);
      if (!score) {
        return res.status(404).json({ error: "Score not found" });
      }

      res.json(score);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sessions/:id/quit", authMiddleware, async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.userId !== req.user!.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (session.status === "completed" || session.status === "abandoned") {
        return res.status(400).json({ error: "Session already ended" });
      }

      // Mark session as abandoned (quit)
      await storage.updateSession(sessionId, { status: "abandoned" });

      res.json({ message: "Session quit successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stats routes
  app.get("/api/stats", authMiddleware, async (req, res) => {
    try {
      const sessions = await storage.getUserSessions(req.user!.userId);
      const scores = await storage.getUserScores(req.user!.userId);

      const totalTests = sessions.filter((s) => s.status === "completed").length;
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length)
        : 0;

      // Calculate improvement (compare last 5 vs previous 5)
      const recentScores = scores.slice(0, 5);
      const previousScores = scores.slice(5, 10);
      const recentAvg = recentScores.length > 0
        ? recentScores.reduce((sum, s) => sum + s.totalScore, 0) / recentScores.length
        : 0;
      const previousAvg = previousScores.length > 0
        ? previousScores.reduce((sum, s) => sum + s.totalScore, 0) / previousScores.length
        : 0;
      const improvement = previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0;

      res.json({ totalTests, averageScore, improvement });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profile/stats", authMiddleware, async (req, res) => {
    try {
      const sessions = await storage.getUserSessions(req.user!.userId);
      const scores = await storage.getUserScores(req.user!.userId);

      const totalTests = sessions.filter((s) => s.status === "completed").length;
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length)
        : 0;

      const topSkills: string[] = [];
      if (averageScore >= 80) topSkills.push("Interview Excellence");
      if (scores.some((s) => s.technicalScore >= 85)) topSkills.push("Technical Expertise");
      if (scores.some((s) => s.communicationScore >= 85)) topSkills.push("Clear Communication");
      if (scores.some((s) => s.grammarScore >= 85)) topSkills.push("Professional Writing");

      res.json({
        totalTests,
        averageScore,
        recentScores: scores.slice(0, 5),
        topSkills,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/stats", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const topicCategories = await storage.getAllTopicCategories();
      const questions = await storage.getAllQuestions();

      // Count all sessions from all users
      let totalSessions = 0;
      for (const user of users) {
        const sessions = await storage.getUserSessions(user.id);
        totalSessions += sessions.filter((s) => s.status === "completed").length;
      }

      res.json({
        totalUsers: users.length,
        totalTopicCategories: topicCategories.length,
        totalQuestions: questions.length,
        totalSessions,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Profile routes
  app.get("/api/profile", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/profile", authMiddleware, async (req, res) => {
    try {
      const validated = updateProfileSchema.parse(req.body);
      
      const user = await storage.updateUser(req.user!.userId, validated);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
