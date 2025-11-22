import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from "recharts";
import { Award, TrendingUp, BookOpen, Target, Brain, Zap } from "lucide-react";

interface AnalyticsData {
    scoreHistory: {
        date: string;
        score: number;
        testName: string;
    }[];
    topicPerformance: {
        topic: string;
        averageScore: number;
        questionsAnswered: number;
    }[];
    skillProfile: {
        strengths: { skill: string; count: number }[];
        improvements: { area: string; count: number }[];
    };
}

export default function Analytics() {
    const { data: analytics, isLoading } = useQuery<AnalyticsData>({
        queryKey: ["/api/analytics/user"],
    });

    const { data: stats } = useQuery<{
        totalTests: number;
        averageScore: number;
        improvement: number;
    }>({
        queryKey: ["/api/stats"],
    });

    if (isLoading) {
        return (
            <div className="p-8 space-y-8">
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[400px]" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Analytics</h1>
                    <p className="text-muted-foreground">
                        Track your progress and identify areas for improvement
                    </p>
                </div>
                <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
                    <h3 className="font-semibold mb-1">Failed to load analytics data</h3>
                    <p>There was an error loading your analytics. Please try refreshing the page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Your Analytics</h1>
                <p className="text-muted-foreground">
                    Track your progress and identify areas for improvement
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.totalTests || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Completed sessions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Award className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.averageScore || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Overall performance
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Skill</CardTitle>
                        <Zap className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold truncate">
                            {analytics.skillProfile.strengths[0]?.skill || "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Most consistent strength
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Performance Trend */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Performance Trend</CardTitle>
                        <CardDescription>Your scores over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analytics.scoreHistory}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        className="text-xs text-muted-foreground"
                                        tick={{ fill: 'currentColor' }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        className="text-xs text-muted-foreground"
                                        tick={{ fill: 'currentColor' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            color: 'hsl(var(--foreground))'
                                        }}
                                        itemStyle={{ color: 'hsl(var(--primary))' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ fill: 'hsl(var(--primary))' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Topic Performance */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Topic Proficiency</CardTitle>
                        <CardDescription>Average score by topic</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.topicPerformance} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis
                                        dataKey="topic"
                                        type="category"
                                        width={100}
                                        className="text-xs text-muted-foreground"
                                        tick={{ fill: 'currentColor' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            color: 'hsl(var(--foreground))'
                                        }}
                                    />
                                    <Bar
                                        dataKey="averageScore"
                                        fill="hsl(var(--primary))"
                                        radius={[0, 4, 4, 0]}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Skills Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-green-500" />
                            Key Strengths
                        </CardTitle>
                        <CardDescription>Areas where you consistently excel</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {analytics.skillProfile.strengths.length > 0 ? (
                                analytics.skillProfile.strengths.map((item, i) => (
                                    <div
                                        key={i}
                                        className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium border border-green-500/20 flex items-center gap-2"
                                    >
                                        {item.skill}
                                        <span className="text-xs opacity-60">x{item.count}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">Complete more tests to identify strengths</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-orange-500" />
                            Areas for Improvement
                        </CardTitle>
                        <CardDescription>Topics to focus your study on</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {analytics.skillProfile.improvements.length > 0 ? (
                                analytics.skillProfile.improvements.map((item, i) => (
                                    <div
                                        key={i}
                                        className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-sm font-medium border border-orange-500/20 flex items-center gap-2"
                                    >
                                        {item.area}
                                        <span className="text-xs opacity-60">x{item.count}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No specific areas identified yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
