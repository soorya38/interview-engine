import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, TrendingUp, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import type { Score } from "@shared/schema";

export default function Results() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();

  const { data: score, isLoading } = useQuery<Score>({
    queryKey: ["/api/sessions", sessionId, "score"],
  });

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
