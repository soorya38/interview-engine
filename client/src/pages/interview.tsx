import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SendHorizontal, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InterviewSession, InterviewTurn } from "@shared/schema";

export default function Interview() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");

  const { data: session, isLoading } = useQuery<InterviewSession & {
    currentQuestion?: { questionText: string };
    turns?: InterviewTurn[];
    totalQuestions?: number;
  }>({
    queryKey: ["/api/sessions", sessionId],
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (userAnswer: string) => {
      return await apiRequest("POST", "/api/sessions/answer", {
        sessionId,
        answer: userAnswer,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
      setAnswer("");
      
      if (data.completed) {
        queryClient.invalidateQueries({ queryKey: ["/api/sessions/history"] });
        setLocation(`/results/${sessionId}`);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to submit answer",
        description: error.message || "Please try again",
      });
    },
  });

  const handleSubmit = () => {
    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Empty answer",
        description: "Please provide an answer before submitting",
      });
      return;
    }
    submitAnswerMutation.mutate(answer);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-3xl p-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Session not found</p>
          <Button onClick={() => setLocation("/tests")} className="mt-4">
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  const progress = session.totalQuestions
    ? ((session.currentQuestionIndex + 1) / session.totalQuestions) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Question {session.currentQuestionIndex + 1} of {session.totalQuestions}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-interview" />
        </div>

        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                Interview Question
              </h2>
              <p className="text-2xl font-medium leading-relaxed" data-testid="text-question">
                {session.currentQuestion?.questionText || "Loading question..."}
              </p>
            </div>

            {session.turns && session.turns.length > 0 && (
              <div className="pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  AI Feedback
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed" data-testid="text-ai-response">
                    {session.turns[session.turns.length - 1]?.aiResponse}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Answer</label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[200px] resize-none"
                disabled={submitAnswerMutation.isPending}
                data-testid="textarea-answer"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Take your time and provide a thoughtful answer
              </p>
              <Button
                onClick={handleSubmit}
                disabled={submitAnswerMutation.isPending || !answer.trim()}
                data-testid="button-submit-answer"
              >
                {submitAnswerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <SendHorizontal className="h-4 w-4 mr-2" />
                    Submit Answer
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
