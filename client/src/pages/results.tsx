import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Award, TrendingUp, ArrowRight, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import type { Score, InterviewTurn } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type TurnWithQuestion = InterviewTurn & {
  question: {
    id: string;
    questionText: string;
    difficulty: string;
  } | null;
};

export default function Results() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();

  const { data: score, isLoading: isScoreLoading } = useQuery<Score>({
    queryKey: ["/api/sessions", sessionId, "score"],
  });

  const { data: turns, isLoading: isTurnsLoading } = useQuery<TurnWithQuestion[]>({
    queryKey: ["/api/sessions", sessionId, "turns"],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/sessions/${sessionId}/turns`);
      return data;
    },
    enabled: !!sessionId,
  });

  const isLoading = isScoreLoading || isTurnsLoading;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!score) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Score not available</p>
          <Button onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case "A":
        return "text-success";
      case "B":
        return "text-chart-1";
      case "C":
        return "text-warning";
      case "D":
      case "F":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-3">
        <div className={`text-7xl font-bold ${getGradeColor(score.grade || 'F')}`} data-testid="text-grade">
          {score.grade}
        </div>
        <h1 className="text-3xl font-semibold">Test Complete!</h1>
        <p className="text-muted-foreground">
          Here's your performance breakdown
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Grammar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2" data-testid="score-grammar">
              {score.grammarScore}%
            </div>
            <Progress value={score.grammarScore} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Technical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2" data-testid="score-technical">
              {score.technicalScore}%
            </div>
            <Progress value={score.technicalScore} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Depth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2" data-testid="score-depth">
              {score.depthScore}%
            </div>
            <Progress value={score.depthScore} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Communication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2" data-testid="score-communication">
              {score.communicationScore}%
            </div>
            <Progress value={score.communicationScore} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Score</CardTitle>
          <CardDescription>Your weighted total performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold text-primary" data-testid="score-total">
              {score.totalScore}%
            </div>
            <div className="flex-1">
              <Progress value={score.totalScore} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                Calculated as: 50% technical + 20% communication + 15% depth + 15% grammar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions and Answers Section */}
      {turns && turns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Questions & Answers
            </CardTitle>
            <CardDescription>
              Review your answers and scores for each question
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
                        <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Your Answer:</h4>
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

      {score.detailedFeedback && (
        <Tabs defaultValue="strengths" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="strengths" data-testid="tab-strengths">Strengths</TabsTrigger>
            <TabsTrigger value="improvements" data-testid="tab-improvements">Areas to Improve</TabsTrigger>
            <TabsTrigger value="recommendations" data-testid="tab-recommendations">Recommendations</TabsTrigger>
          </TabsList>
          <TabsContent value="strengths" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {score.detailedFeedback.strengths?.map((strength, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-success mt-2" />
                    <p className="text-sm">{strength}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="improvements" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {score.detailedFeedback.improvements?.map((improvement, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-warning mt-2" />
                    <p className="text-sm">{improvement}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recommendations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {score.detailedFeedback.recommendations?.map((recommendation, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex gap-4 justify-center pt-4">
        <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-dashboard">
          Back to Dashboard
        </Button>
        <Button onClick={() => setLocation("/tests")} data-testid="button-new-test">
          <ArrowRight className="h-4 w-4 mr-2" />
          Take Another Test
        </Button>
      </div>
    </div>
  );
}
