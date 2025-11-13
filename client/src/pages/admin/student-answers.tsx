import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  BookOpen, 
  Clock, 
  User, 
  Award, 
  MessageSquare, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { InterviewSession, Score, InterviewTurn } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

type StudentSession = InterviewSession & {
  user: {
    id: string;
    username: string;
    fullName?: string;
    email?: string;
  };
  testName?: string;
  score?: Score;
  questionCount?: number;
  totalQuestions?: number;
};

type TurnWithQuestion = InterviewTurn & {
  question: {
    id: string;
    questionText: string;
    difficulty: string;
  } | null;
};

export default function StudentAnswers() {
  const [, setLocation] = useLocation();
  
  const { data: sessions, isLoading } = useQuery<StudentSession[]>({
    queryKey: ["/api/admin/student-sessions"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/admin/student-sessions");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2">Student Answers</h1>
        <p className="text-muted-foreground">View all student test submissions and answers</p>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{session.testName || "Test"}</h3>
                        <Badge variant="outline">{session.user.username}</Badge>
                        {session.user.fullName && (
                          <span className="text-sm text-muted-foreground">
                            ({session.user.fullName})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(session.startedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        {session.completedAt && (
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            <span>
                              Completed at{" "}
                              {new Date(session.completedAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                        {session.questionCount !== undefined && session.totalQuestions !== undefined && (
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            <MessageSquare className="h-4 w-4" />
                            <span>
                              {session.questionCount} of {session.totalQuestions} questions
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {session.score && (
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="h-5 w-5 text-primary" />
                            <span className="text-3xl font-bold">{session.score.totalScore}%</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Grade: <span className="font-semibold">{session.score.grade}</span>
                          </div>
                        </div>
                        <Link href={`/admin/student-answers/${session.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No student submissions</p>
              <p className="text-sm">Student test submissions will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function StudentAnswerDetail() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();

  const { data: sessionData, isLoading } = useQuery<{
    session: InterviewSession;
    user: {
      id: string;
      username: string;
      fullName?: string;
      email?: string;
    } | null;
    test: {
      id: string;
      name: string;
      description?: string;
    } | null;
    score?: Score;
    turns: TurnWithQuestion[];
  }>({
    queryKey: ["/api/admin/student-sessions", sessionId],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/admin/student-sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Session not found</p>
          <Button onClick={() => setLocation("/admin/student-answers")}>
            Back to Student Answers
          </Button>
        </div>
      </div>
    );
  }

  const { session, user, test, score, turns } = sessionData;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-foreground mb-2">Student Answer Details</h1>
            <p className="text-muted-foreground">
              {test?.name || "Test"} - {user?.username || "Unknown User"}
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/admin/student-answers")}>
            Back to List
          </Button>
        </div>

        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Username</div>
                  <div className="font-semibold">{user.username}</div>
                </div>
                {user.fullName && (
                  <div>
                    <div className="text-sm text-muted-foreground">Full Name</div>
                    <div className="font-semibold">{user.fullName}</div>
                  </div>
                )}
                {user.email && (
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-semibold">{user.email}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Started</div>
                  <div className="font-semibold">
                    {new Date(session.startedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {score && (
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Grammar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{score.grammarScore}%</div>
                <Progress value={score.grammarScore} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Technical</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{score.technicalScore}%</div>
                <Progress value={score.technicalScore} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{score.depthScore}%</div>
                <Progress value={score.depthScore} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{score.communicationScore}%</div>
                <Progress value={score.communicationScore} className="h-2" />
              </CardContent>
            </Card>
          </div>
        )}

        {score && (
          <Card>
            <CardHeader>
              <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-5xl font-bold text-primary">{score.totalScore}%</div>
                <div className="flex-1">
                  <Progress value={score.totalScore} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Grade: <span className="font-semibold">{score.grade}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {turns && turns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Questions & Answers
              </CardTitle>
              <CardDescription>
                Review student answers and scores for each question
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {turns.map((turn, index) => {
                  const evalData = turn.evaluation;
                  const questionNumber = index + 1;
                  const totalScore = evalData
                    ? Math.round(
                        evalData.technical * 0.5 +
                        evalData.communication * 0.2 +
                        evalData.depth * 0.15 +
                        evalData.grammar * 0.15
                      )
                    : 0;

                  return (
                    <AccordionItem key={turn.id} value={`question-${turn.id}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Question {questionNumber}</span>
                            {turn.question && (
                              <Badge variant="outline">{turn.question.difficulty}</Badge>
                            )}
                          </div>
                          {evalData && (
                            <div className="flex items-center gap-4 ml-auto mr-4">
                              <span className="text-sm text-muted-foreground">Score:</span>
                              <span className="font-bold text-lg">{totalScore}%</span>
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        {turn.question && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Question:</h4>
                            <p className="text-base leading-relaxed">{turn.question.questionText}</p>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Student Answer:</h4>
                          <p className="text-base leading-relaxed bg-muted/50 p-4 rounded-lg">
                            {turn.userAnswer}
                          </p>
                        </div>

                        {evalData && (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Grammar</div>
                                <div className="text-lg font-semibold">{evalData.grammar || 0}%</div>
                                <Progress value={evalData.grammar || 0} className="h-2 mt-1" />
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Technical</div>
                                <div className="text-lg font-semibold">{evalData.technical || 0}%</div>
                                <Progress value={evalData.technical || 0} className="h-2 mt-1" />
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Depth</div>
                                <div className="text-lg font-semibold">{evalData.depth || 0}%</div>
                                <Progress value={evalData.depth || 0} className="h-2 mt-1" />
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Communication</div>
                                <div className="text-lg font-semibold">{evalData.communication || 0}%</div>
                                <Progress value={evalData.communication || 0} className="h-2 mt-1" />
                              </div>
                            </div>

                            {evalData.feedback && (
                              <div className="pt-2">
                                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Feedback:</h4>
                                <p className="text-sm leading-relaxed">{evalData.feedback}</p>
                              </div>
                            )}

                            {Array.isArray(evalData.strengths) && evalData.strengths.length > 0 && (
                              <div className="pt-2">
                                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                  Strengths:
                                </h4>
                                <ul className="space-y-1">
                                  {evalData.strengths.map((strength, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <div className="h-1.5 w-1.5 rounded-full bg-success mt-2 flex-shrink-0" />
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {Array.isArray(evalData.areasToImprove) && evalData.areasToImprove.length > 0 && (
                              <div className="pt-2">
                                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-warning" />
                                  Areas to Improve:
                                </h4>
                                <ul className="space-y-1">
                                  {evalData.areasToImprove.map((area, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <div className="h-1.5 w-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                                      <span>{area}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {Array.isArray(evalData.recommendations) && evalData.recommendations.length > 0 && (
                              <div className="pt-2">
                                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-primary" />
                                  Recommendations:
                                </h4>
                                <ul className="space-y-1">
                                  {evalData.recommendations.map((rec, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

