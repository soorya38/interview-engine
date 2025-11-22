import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Tests from "@/pages/tests";
import Practice from "@/pages/practice";
import Interview from "@/pages/interview";
import Results from "@/pages/results";
import History from "@/pages/history";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminTopics from "@/pages/admin/topics";
import AdminPractice from "@/pages/admin/practice";
import AdminTopicCategories from "@/pages/admin/topic-categories";
import AdminQuestions from "@/pages/admin/questions";
import AdminUsers from "@/pages/admin/users";
import StudentAnswers, { StudentAnswerDetail } from "@/pages/admin/student-answers";
import Analytics from "@/pages/admin/analytics";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user.role !== "admin" && user.role !== "instructor") {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function RootRedirect() {
  const { user, isLoading } = useAuth();

  console.log("RootRedirect render - user:", user?.username, "isLoading:", isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log("RootRedirect: No user, redirecting to login");
    return <Redirect to="/login" />;
  }

  if (user.role === "admin" || user.role === "instructor") {
    console.log("RootRedirect: Admin user, redirecting to admin");
    return <Redirect to="/admin" />;
  }

  console.log("RootRedirect: Regular user, redirecting to dashboard");
  return <Redirect to="/dashboard" />;
}

function Router() {
  const { user, isLoading } = useAuth();

  // Debug logging
  console.log("Router render - user:", user?.username, "isLoading:", isLoading);

  // Force re-render when auth state changes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Use key to force re-render when user changes
  return (
    <Switch key={user?.id || 'no-user'}>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/tests">
        {() => <ProtectedRoute component={Tests} />}
      </Route>
      <Route path="/practice">
        {() => <ProtectedRoute component={Practice} />}
      </Route>
      <Route path="/analytics">
        {() => <ProtectedRoute component={Analytics} />}
      </Route>
      <Route path="/interview/:sessionId">
        {() => <ProtectedRoute component={Interview} />}
      </Route>
      <Route path="/results/:sessionId">
        {() => <ProtectedRoute component={Results} />}
      </Route>
      <Route path="/history">
        {() => <ProtectedRoute component={History} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} adminOnly />}
      </Route>
      <Route path="/admin/topics">
        {() => <ProtectedRoute component={AdminTopics} adminOnly />}
      </Route>
      <Route path="/admin/practice">
        {() => <ProtectedRoute component={AdminPractice} adminOnly />}
      </Route>
      <Route path="/admin/topic-categories">
        {() => <ProtectedRoute component={AdminTopicCategories} adminOnly />}
      </Route>
      <Route path="/admin/questions">
        {() => <ProtectedRoute component={AdminQuestions} adminOnly />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} adminOnly />}
      </Route>
      <Route path="/admin/student-answers">
        {() => <ProtectedRoute component={StudentAnswers} adminOnly />}
      </Route>
      <Route path="/admin/student-answers/:sessionId">
        {() => <ProtectedRoute component={StudentAnswerDetail} adminOnly />}
      </Route>
      <Route path="/admin/analytics">
        {() => <ProtectedRoute component={Analytics} adminOnly />}
      </Route>
      <Route path="/">
        {() => <RootRedirect />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Show sidebar if user is authenticated and not on login/register pages or interview page
  const showSidebar = user && !isLoading && !["/login", "/register"].includes(location) && !location.startsWith("/interview/");

  const style = {
    "--sidebar-width": "280px",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!showSidebar) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-16 px-6 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <AppLayout />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
