import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Award, TrendingUp, Calendar } from "lucide-react";
import type { Score } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<{
    totalTests: number;
    averageScore: number;
    recentScores: Score[];
    topSkills: string[];
  }>({
    queryKey: ["/api/profile/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
            {user?.username?.[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-semibold mb-1" data-testid="text-username">
            {user?.username}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {user?.role}
            </Badge>
            <span className="text-sm">
              Member since {new Date(user?.createdAt || "").toLocaleDateString()}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Performance Stats
            </CardTitle>
            <CardDescription>Your interview performance overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Interviews</span>
              <span className="text-2xl font-bold" data-testid="stat-total-interviews">
                {stats?.totalTests || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Score</span>
              <span className="text-2xl font-bold text-primary" data-testid="stat-avg-score">
                {stats?.averageScore || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recent Trend</span>
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">Improving</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest interview sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentScores && stats.recentScores.length > 0 ? (
              <div className="space-y-3">
                {stats.recentScores.slice(0, 5).map((score) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between p-2 rounded-md hover-elevate"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(score.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{score.totalScore}%</span>
                      <Badge variant={score.grade === "A" ? "default" : "secondary"}>
                        {score.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No activity yet</p>
                <p className="text-sm mt-1">Start an interview to see your progress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats?.topSkills && stats.topSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Skills</CardTitle>
            <CardDescription>Areas where you excel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topSkills.map((skill, i) => (
                <Badge key={i} variant="outline" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
