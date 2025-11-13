import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award,
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type AnalyticsData = {
  totalSessions: number;
  totalUsers: number;
  activeUsers: number;
  averageScores: {
    grammar: number;
    technical: number;
    depth: number;
    communication: number;
    total: number;
  };
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  sessionsByDay: Record<string, number>;
};

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/admin/analytics");
      return data;
    },
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

  if (!analytics) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const totalGrades = Object.values(analytics.gradeDistribution).reduce((sum, val) => sum + val, 0);
  const maxGradeCount = Math.max(...Object.values(analytics.gradeDistribution), 1);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Platform performance and student statistics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users who completed tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.averageScores.total}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all tests
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Scores by Category</CardTitle>
            <CardDescription>Performance breakdown across evaluation criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Grammar</span>
                <span className="text-sm font-bold">{analytics.averageScores.grammar}%</span>
              </div>
              <Progress value={analytics.averageScores.grammar} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Technical</span>
                <span className="text-sm font-bold">{analytics.averageScores.technical}%</span>
              </div>
              <Progress value={analytics.averageScores.technical} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Depth</span>
                <span className="text-sm font-bold">{analytics.averageScores.depth}%</span>
              </div>
              <Progress value={analytics.averageScores.depth} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Communication</span>
                <span className="text-sm font-bold">{analytics.averageScores.communication}%</span>
              </div>
              <Progress value={analytics.averageScores.communication} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Distribution of grades across all tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
              <div key={grade}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Grade {grade}</span>
                  <span className="text-sm font-bold">
                    {count} {count === 1 ? 'test' : 'tests'}
                    {totalGrades > 0 && (
                      <span className="text-muted-foreground ml-2">
                        ({Math.round((count / totalGrades) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <Progress 
                  value={totalGrades > 0 ? (count / maxGradeCount) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Test Activity (Last 30 Days)
          </CardTitle>
          <CardDescription>Number of tests completed per day</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(analytics.sessionsByDay).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(analytics.sessionsByDay)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, count]) => {
                  const dateObj = new Date(date);
                  const maxCount = Math.max(...Object.values(analytics.sessionsByDay), 1);
                  return (
                    <div key={date}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {dateObj.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-sm font-bold">{count} {count === 1 ? 'test' : 'tests'}</span>
                      </div>
                      <Progress value={(count / maxCount) * 100} className="h-2" />
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No test activity in the last 30 days</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

