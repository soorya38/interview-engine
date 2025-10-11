import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, PlayCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Test, Question } from "@shared/schema";

export default function Tests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tests, isLoading } = useQuery<(Test & { questionCount?: number })[]>({
    queryKey: ["/api/tests"],
  });

  const startInterviewMutation = useMutation({
    mutationFn: async (testId: string) => {
      return await apiRequest("POST", "/api/sessions/start", { testId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setLocation(`/interview/${data.session.id}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to start interview",
        description: error.message || "Please try again",
      });
    },
  });

  const filteredTests = tests?.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2">
          Available Tests
        </h1>
        <p className="text-muted-foreground">
          Choose a test to start your mock interview
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search tests..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-tests"
        />
      </div>

      {filteredTests && filteredTests.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTests.map((test) => (
            <Card key={test.id} className="hover-elevate" data-testid={`test-card-${test.id}`}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{test.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {test.description || "Practice interview questions on this test"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{test.questionCount || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{test.duration ? `${test.duration} min` : "~20 min"}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => startInterviewMutation.mutate(test.id)}
                  disabled={startInterviewMutation.isPending}
                  data-testid={`button-start-${test.id}`}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {startInterviewMutation.isPending ? "Starting..." : "Start Interview"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No tests found</p>
            <p className="text-sm">
              {searchQuery ? "Try a different search term" : "No interview tests available yet"}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
