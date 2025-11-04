import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, FileQuestion, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<{
    totalUsers: number;
    totalTopics: number;
    totalQuestions: number;
    totalSessions: number;
  }>({
    queryKey: ["/api/admin/stats"],
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
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage platform content and monitor activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-users">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-topics">
              {stats?.totalTopics || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Test categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <FileQuestion className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-questions">
              {stats?.totalQuestions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In question bank
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-sessions">
              {stats?.totalSessions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tests conducted
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage platform content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/topics"
              className="block p-3 rounded-lg border border-border hover-elevate active-elevate-2"
              data-testid="link-manage-topics"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Manage Topics</p>
                  <p className="text-sm text-muted-foreground">Add or edit test topics</p>
                </div>
              </div>
            </a>
            <a
              href="/admin/questions"
              className="block p-3 rounded-lg border border-border hover-elevate active-elevate-2"
              data-testid="link-manage-questions"
            >
              <div className="flex items-center gap-3">
                <FileQuestion className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Manage Questions</p>
                  <p className="text-sm text-muted-foreground">Build question bank</p>
                </div>
              </div>
            </a>
            <a
              href="/admin/users"
              className="block p-3 rounded-lg border border-border hover-elevate active-elevate-2"
              data-testid="link-manage-users"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-muted-foreground">View and manage user accounts</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Platform activity will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
