import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Award, TrendingUp, Calendar, Edit, Save, X } from "lucide-react";
import type { Score, UpdateProfile } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profileData, isLoading: isLoadingProfile } = useQuery<typeof user>({
    queryKey: ["/api/profile"],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<{
    totalTests: number;
    averageScore: number;
    recentScores: Score[];
    topSkills: string[];
  }>({
    queryKey: ["/api/profile/stats"],
  });

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      profileData: {
        bio: "",
        skills: [],
        experience: "",
        education: "",
      },
    },
  });

  useEffect(() => {
    if (profileData) {
      form.reset({
        fullName: profileData.fullName || "",
        email: profileData.email || "",
        profileData: {
          bio: profileData.profileData?.bio || "",
          skills: profileData.profileData?.skills || [],
          experience: profileData.profileData?.experience || "",
          education: profileData.profileData?.education || "",
        },
      });
    }
  }, [profileData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      return await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfile) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset({
      fullName: profileData?.fullName || "",
      email: profileData?.email || "",
      profileData: {
        bio: profileData?.profileData?.bio || "",
        skills: profileData?.profileData?.skills || [],
        experience: profileData?.profileData?.experience || "",
        education: profileData?.profileData?.education || "",
      },
    });
    setIsEditing(false);
  };

  if (isLoadingProfile || isLoadingStats) {
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

  const displayUser = profileData || user;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
              {displayUser?.username?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-semibold mb-1" data-testid="text-username">
              {displayUser?.username}
            </h1>
            <div className="text-muted-foreground flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {displayUser?.role}
              </Badge>
              <span className="text-sm">
                Member since {new Date(displayUser?.createdAt || "").toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={() => {
              form.reset({
                fullName: displayUser?.fullName || "",
                email: displayUser?.email || "",
                profileData: {
                  bio: displayUser?.profileData?.bio || "",
                  skills: displayUser?.profileData?.skills || [],
                  experience: displayUser?.profileData?.experience || "",
                  education: displayUser?.profileData?.education || "",
                },
              });
              setIsEditing(true);
            }}
            variant="outline"
            data-testid="button-edit-profile"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} data-testid="input-fullname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileData.bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself"
                          className="resize-none"
                          {...field}
                          data-testid="input-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileData.experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Your work experience"
                          className="resize-none"
                          {...field}
                          data-testid="input-experience"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileData.education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Your educational background"
                          className="resize-none"
                          {...field}
                          data-testid="input-education"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-profile">
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayUser?.fullName && (
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium" data-testid="text-fullname">{displayUser.fullName}</p>
                </div>
              )}
              {displayUser?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium" data-testid="text-email">{displayUser.email}</p>
                </div>
              )}
              {displayUser?.profileData?.bio && (
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="font-medium" data-testid="text-bio">{displayUser.profileData.bio}</p>
                </div>
              )}
              {displayUser?.profileData?.experience && (
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium" data-testid="text-experience">{displayUser.profileData.experience}</p>
                </div>
              )}
              {displayUser?.profileData?.education && (
                <div>
                  <p className="text-sm text-muted-foreground">Education</p>
                  <p className="font-medium" data-testid="text-education">{displayUser.profileData.education}</p>
                </div>
              )}
              {!displayUser?.fullName && !displayUser?.email && !displayUser?.profileData?.bio && 
               !displayUser?.profileData?.experience && !displayUser?.profileData?.education && (
                <p className="text-sm text-muted-foreground">No profile information added yet. Click Edit Profile to add your details.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Performance Stats
              </CardTitle>
              <CardDescription>Your test performance overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Tests</span>
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
        </div>
      )}

      {!isEditing && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest test sessions</CardDescription>
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
                  <p className="text-sm mt-1">Start a test to see your progress</p>
                </div>
              )}
            </CardContent>
          </Card>

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
        </>
      )}
    </div>
  );
}
