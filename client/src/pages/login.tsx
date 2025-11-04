import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionRef = useRef(false);

  // Handle navigation after successful login
  useEffect(() => {
    if (user) {
      console.log("User detected in Login component, navigating...");
      if (user.role === "admin" || user.role === "instructor") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    // Prevent double submission with multiple checks
    if (isLoading || isSubmitting || submissionRef.current) {
      console.log("Login already in progress, ignoring duplicate submission");
      return;
    }
    
    submissionRef.current = true;
    setIsLoading(true);
    setIsSubmitting(true);
    
    try {
      console.log("Starting login process...");
      const response = await apiRequest("POST", "/api/auth/login", data);
      
      // Validate response before proceeding
      if (!response.user || !response.token) {
        throw new Error("Invalid response from server");
      }
      
      console.log("Login successful, updating auth state...");
      // Update authentication state - useEffect will handle navigation
      login(response.user, response.token);
      
      // Show success toast immediately
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      console.log("Login complete, auth state updated - useEffect will handle navigation");
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials",
      });
    } finally {
      submissionRef.current = false;
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">AM</span>
            </div>
            <div>
              <CardTitle className="text-2xl">AI MockMate</CardTitle>
              <CardDescription>AI-Powered Education Practice</CardDescription>
            </div>
          </div>
          <CardDescription className="pt-2">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        data-testid="input-username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isSubmitting}
                data-testid="button-login"
              >
                {isLoading || isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a
                  href="/register"
                  className="text-primary hover:underline"
                  data-testid="link-register"
                >
                  Sign up
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
