import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ArrowRight, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Score, InterviewSession } from "@shared/schema";
import { Link } from "wouter";

export default function History() {
  const { data: sessions, isLoading } = useQuery<
    (InterviewSession & { score?: Score; topicName?: string })[]
  >({
    queryKey: ["/api/sessions/history"],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
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
        <h1 className="text-4xl font-semibold text-foreground mb-2">Test History</h1>
        <p className="text-muted-foreground">View all your completed test sessions</p>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} data-testid={`history-session-${session.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{session.topicName || "Test"}</h3>
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
                      </div>
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

                      <Link href={`/results/${session.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-${session.id}`}>
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
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
              <p className="text-lg font-medium mb-2">No test history</p>
              <p className="text-sm">Complete your first test to see your history here</p>
              <Link href="/tests">
                <Button className="mt-4">
                  Start New Test
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
