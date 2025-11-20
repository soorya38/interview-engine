import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  BarChart3,
  FileText,
  ArrowRight,
  Download,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

type AnalyticsData = {
  totalSessions: number;
  totalUsers?: number;
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

type Test = {
  id: string;
  name: string;
  description: string;
  questionCount: number;
};

type StudentSession = {
  id: string;
  testId: string;
  userId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  user: {
    id: string;
    username: string;
    fullName?: string;
    email?: string;
  };
  testName?: string;
  score?: {
    totalScore: number;
    grade: string;
  };
  questionCount?: number;
  totalQuestions?: number;
};

function AnalyticsSection({
  title,
  description,
  analytics,
  showTotalUsers = false
}: {
  title: string;
  description: string;
  analytics: AnalyticsData;
  showTotalUsers?: boolean;
}) {
  const totalGrades = Object.values(analytics.gradeDistribution).reduce((sum, val) => sum + val, 0);
  const maxGradeCount = Math.max(...Object.values(analytics.gradeDistribution), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className={`grid gap - 6 ${showTotalUsers ? 'md:grid-cols-4' : 'md:grid-cols-3'} `}>
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

        {showTotalUsers && analytics.totalUsers !== undefined && (
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
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users who completed {showTotalUsers ? 'tests' : 'this test'}
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
              Across all {showTotalUsers ? 'tests' : 'sessions'}
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
            <CardDescription>Distribution of grades across {showTotalUsers ? 'all tests' : 'this test'}</CardDescription>
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

function StudentAnswersList({ testId }: { testId: string }) {
  const { data: sessions, isLoading } = useQuery<StudentSession[]>({
    queryKey: ["/api/admin/student-sessions", testId],
    queryFn: async () => {
      const endpoint = testId === "all"
        ? "/api/admin/student-sessions?page=1&limit=100"
        : `/ api / admin / student - sessions ? page = 1 & limit=100`;
      const res = await apiRequest("GET", endpoint);
      const allSessions = res.sessions || [];

      // Filter by testId if not "all"
      if (testId !== "all") {
        return allSessions.filter((s: StudentSession) => s.testId === testId);
      }
      return allSessions;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No student submissions</p>
            <p className="text-sm">
              {testId === "all"
                ? "Student test submissions will appear here"
                : "No submissions for this test yet"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{session.testName || "Test"}</h3>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{session.user.username}</span>
                  {session.user.fullName && (
                    <>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{session.user.fullName}</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Completed {new Date(session.completedAt || session.startedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {session.score && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{session.score.totalScore}%</div>
                    <div className="text-sm text-muted-foreground">Grade: {session.score.grade}</div>
                  </div>
                )}
                <Link href={`/ admin / student - answers / ${session.id} `}>
                  <Button variant="outline" size="sm">
                    View Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Excel Export Dialog Component
function ExcelExportDialog({
  analytics,
  testName,
  sessions,
  testId
}: {
  analytics: AnalyticsData;
  testName: string;
  sessions?: StudentSession[];
  testId: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFields, setSelectedFields] = useState({
    totalSessions: true,
    totalUsers: true,
    activeUsers: true,
    averageScores: true,
    gradeDistribution: true,
    dailyActivity: true,
    studentSubmissions: true,
    detailedAnswers: false,
  });

  const [selectedColumns, setSelectedColumns] = useState({
    username: true,
    fullName: true,
    testName: true,
    completedAt: true,
    totalScore: true,
    grade: true,
  });

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(10);

    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      if (selectedFields.totalSessions || selectedFields.totalUsers || selectedFields.activeUsers || selectedFields.averageScores) {
        const summaryData = [];

        if (selectedFields.totalSessions) {
          summaryData.push(['Total Sessions', analytics.totalSessions.toString()]);
        }
        if (selectedFields.totalUsers && analytics.totalUsers !== undefined) {
          summaryData.push(['Total Users', analytics.totalUsers.toString()]);
        }
        if (selectedFields.activeUsers) {
          summaryData.push(['Active Users', analytics.activeUsers.toString()]);
        }
        if (selectedFields.averageScores) {
          summaryData.push(['', '']);
          summaryData.push(['Average Scores', '']);
          summaryData.push(['Grammar', `${analytics.averageScores.grammar}%`]);
          summaryData.push(['Technical', `${analytics.averageScores.technical}%`]);
          summaryData.push(['Depth', `${analytics.averageScores.depth}%`]);
          summaryData.push(['Communication', `${analytics.averageScores.communication}%`]);
          summaryData.push(['Total', `${analytics.averageScores.total}%`]);
        }

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }

      setProgress(30);

      // Grade Distribution Sheet
      if (selectedFields.gradeDistribution) {
        const gradeData = [
          ['Grade', 'Count', 'Percentage'],
        ];
        const totalGrades = Object.values(analytics.gradeDistribution).reduce((sum, val) => sum + val, 0);

        Object.entries(analytics.gradeDistribution).forEach(([grade, count]) => {
          const percentage = totalGrades > 0 ? ((count / totalGrades) * 100).toFixed(1) : '0';
          gradeData.push([grade, count.toString(), `${percentage}%`]);
        });

        const gradeSheet = XLSX.utils.aoa_to_sheet(gradeData);
        XLSX.utils.book_append_sheet(workbook, gradeSheet, 'Grade Distribution');
      }

      // Daily Activity Sheet
      if (selectedFields.dailyActivity && Object.keys(analytics.sessionsByDay).length > 0) {
        const activityData = [
          ['Date', 'Sessions'],
        ];

        Object.entries(analytics.sessionsByDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([date, count]) => {
            activityData.push([date, count.toString()]);
          });

        const activitySheet = XLSX.utils.aoa_to_sheet(activityData);
        XLSX.utils.book_append_sheet(workbook, activitySheet, 'Daily Activity');
      }

      setProgress(50);

      // Student Submissions Sheet
      if (selectedFields.studentSubmissions && sessions && sessions.length > 0) {
        // Build header row based on selected columns
        const headerRow = [];
        if (selectedColumns.username) headerRow.push('Username');
        if (selectedColumns.fullName) headerRow.push('Full Name');
        if (selectedColumns.testName) headerRow.push('Test');
        if (selectedColumns.completedAt) headerRow.push('Completed At');
        if (selectedColumns.totalScore) headerRow.push('Total Score');
        if (selectedColumns.grade) headerRow.push('Grade');

        const submissionsData = [headerRow];

        sessions.forEach((session) => {
          const row = [];
          if (selectedColumns.username) row.push(session.user.username);
          if (selectedColumns.fullName) row.push(session.user.fullName || '');
          if (selectedColumns.testName) row.push(session.testName || '');
          if (selectedColumns.completedAt) row.push(session.completedAt ? new Date(session.completedAt).toLocaleString() : '');
          if (selectedColumns.totalScore) row.push(session.score?.totalScore?.toString() || '');
          if (selectedColumns.grade) row.push(session.score?.grade || '');

          submissionsData.push(row);
        });

        const submissionsSheet = XLSX.utils.aoa_to_sheet(submissionsData);
        XLSX.utils.book_append_sheet(workbook, submissionsSheet, 'Student Submissions');
      }

      // Detailed Answers Sheet
      if (selectedFields.detailedAnswers) {
        setProgress(60);
        const detailedData = await apiRequest("GET", `/api/admin/export-data?testId=${testId}`);
        setProgress(80);

        const rows = [['Session ID', 'Username', 'Full Name', 'Test', 'Date', 'Question', 'Answer', 'AI Feedback', 'Grade']];
        detailedData.forEach((row: any) => {
          rows.push([
            row.sessionId,
            row.username,
            row.fullName || '',
            row.testName,
            new Date(row.completedAt).toLocaleString(),
            row.questionText,
            row.userAnswer,
            row.aiResponse,
            row.grade || ''
          ]);
        });

        const sheet = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, sheet, 'Detailed Answers');
      }

      setProgress(90);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `analytics-${testName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${date}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      setProgress(100);
      toast({
        title: "Export Successful",
        description: "Your Excel file has been downloaded.",
      });

      setTimeout(() => {
        setOpen(false);
        setProgress(0);
      }, 1000);

    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the Excel file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isExporting && setOpen(val)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Analytics to Excel</DialogTitle>
          <DialogDescription>
            Select the fields you want to include in the Excel export
          </DialogDescription>
        </DialogHeader>

        {isExporting && (
          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Exporting data...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className={`space-y-4 py-4 ${isExporting ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="totalSessions"
              checked={selectedFields.totalSessions}
              onCheckedChange={(checked) =>
                setSelectedFields({ ...selectedFields, totalSessions: checked as boolean })
              }
            />
            <Label htmlFor="totalSessions" className="cursor-pointer">
              Total Sessions
            </Label>
          </div>

          {analytics.totalUsers !== undefined && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="totalUsers"
                checked={selectedFields.totalUsers}
                onCheckedChange={(checked) =>
                  setSelectedFields({ ...selectedFields, totalUsers: checked as boolean })
                }
              />
              <Label htmlFor="totalUsers" className="cursor-pointer">
                Total Users
              </Label>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="activeUsers"
              checked={selectedFields.activeUsers}
              onCheckedChange={(checked) =>
                setSelectedFields({ ...selectedFields, activeUsers: checked as boolean })
              }
            />
            <Label htmlFor="activeUsers" className="cursor-pointer">
              Active Users
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="averageScores"
              checked={selectedFields.averageScores}
              onCheckedChange={(checked) =>
                setSelectedFields({ ...selectedFields, averageScores: checked as boolean })
              }
            />
            <Label htmlFor="averageScores" className="cursor-pointer">
              Average Scores (All Categories)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="gradeDistribution"
              checked={selectedFields.gradeDistribution}
              onCheckedChange={(checked) =>
                setSelectedFields({ ...selectedFields, gradeDistribution: checked as boolean })
              }
            />
            <Label htmlFor="gradeDistribution" className="cursor-pointer">
              Grade Distribution
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dailyActivity"
              checked={selectedFields.dailyActivity}
              onCheckedChange={(checked) =>
                setSelectedFields({ ...selectedFields, dailyActivity: checked as boolean })
              }
            />
            <Label htmlFor="dailyActivity" className="cursor-pointer">
              Daily Activity (Last 30 Days)
            </Label>
          </div>

          {sessions && sessions.length > 0 && (
            <div className="space-y-3 border rounded-md p-3 bg-muted/20">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="studentSubmissions"
                  checked={selectedFields.studentSubmissions}
                  onCheckedChange={(checked) =>
                    setSelectedFields({ ...selectedFields, studentSubmissions: checked as boolean })
                  }
                />
                <Label htmlFor="studentSubmissions" className="cursor-pointer font-medium">
                  Student Submissions ({sessions.length} records)
                </Label>
              </div>

              {selectedFields.studentSubmissions && (
                <div className="ml-6 grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-username"
                      checked={selectedColumns.username}
                      onCheckedChange={(checked) =>
                        setSelectedColumns({ ...selectedColumns, username: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-username" className="text-sm cursor-pointer">Username</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-fullname"
                      checked={selectedColumns.fullName}
                      onCheckedChange={(checked) =>
                        setSelectedColumns({ ...selectedColumns, fullName: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-fullname" className="text-sm cursor-pointer">Full Name</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-test"
                      checked={selectedColumns.testName}
                      onCheckedChange={(checked) =>
                        setSelectedColumns({ ...selectedColumns, testName: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-test" className="text-sm cursor-pointer">Test Name</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-date"
                      checked={selectedColumns.completedAt}
                      onCheckedChange={(checked) =>
                        setSelectedColumns({ ...selectedColumns, completedAt: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-date" className="text-sm cursor-pointer">Date</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-score"
                      checked={selectedColumns.totalScore}
                      onCheckedChange={(checked) =>
                        setSelectedColumns({ ...selectedColumns, totalScore: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-score" className="text-sm cursor-pointer">Score</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-grade"
                      checked={selectedColumns.grade}
                      onCheckedChange={(checked) =>
                        setSelectedColumns({ ...selectedColumns, grade: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-grade" className="text-sm cursor-pointer">Grade</Label>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 border-t pt-4">
            <Checkbox
              id="detailedAnswers"
              checked={selectedFields.detailedAnswers}
              onCheckedChange={(checked) =>
                setSelectedFields({ ...selectedFields, detailedAnswers: checked as boolean })
              }
            />
            <Label htmlFor="detailedAnswers" className="cursor-pointer font-medium">
              Include Detailed Answers (Questions & Responses)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Analytics() {
  const [selectedTestId, setSelectedTestId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: tests, isLoading: testsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/tests");
      return data;
    },
  });

  const { data: generalAnalytics, isLoading: generalLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/admin/analytics");
      return data;
    },
  });

  const { data: testAnalytics, isLoading: testLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics/test", selectedTestId],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/admin/analytics/test/${selectedTestId}`);
      return data;
    },
    enabled: selectedTestId !== "all",
  });

  // Fetch student sessions for export
  const { data: allSessions } = useQuery<{ sessions: StudentSession[] }>({
    queryKey: ["/api/admin/student-sessions"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/admin/student-sessions?page=1&limit=1000");
      return data;
    },
  });

  const selectedTest = tests?.find(t => t.id === selectedTestId);

  // Filter sessions by selected test
  const filteredSessions = selectedTestId === "all"
    ? allSessions?.sessions
    : allSessions?.sessions?.filter(s => s.testId === selectedTestId);

  // Filter tests based on search query only
  const filteredTests = tests?.filter((test) => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  if (generalLoading || testsLoading) {
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

  if (!generalAnalytics) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Platform performance and student statistics</p>
      </div>

      {/* Test Selection */}
      <div className="flex items-start gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />

          {/* Search Suggestions */}
          {searchQuery && filteredTests.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredTests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => {
                    setSelectedTestId(test.id);
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-b-0"
                >
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {test.questionCount} questions
                    {test.description && ` • ${test.description.substring(0, 60)}${test.description.length > 60 ? '...' : ''} `}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery && filteredTests.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg p-4">
              <p className="text-sm text-muted-foreground">No tests match your search</p>
            </div>
          )}
        </div>
        <div className="flex-1">
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          >
            <option value="all">All Tests (General Analytics)</option>
            {filteredTests.map((test) => (
              <option key={test.id} value={test.id}>
                {test.name} - {test.questionCount} questions
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t pt-8" />

      {/* Tabs for Analytics and Student Answers */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="student-answers" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Student Answers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Export Button */}
          <div className="flex justify-end">
            {selectedTestId === "all" && generalAnalytics && (
              <ExcelExportDialog
                analytics={generalAnalytics}
                testName="All Tests"
                sessions={filteredSessions}
                testId={selectedTestId}
              />
            )}
            {selectedTestId !== "all" && testAnalytics && (
              <ExcelExportDialog
                analytics={testAnalytics}
                testName={selectedTest?.name || "Test"}
                sessions={filteredSessions}
                testId={selectedTestId}
              />
            )}
          </div>

          {selectedTestId === "all" ? (
            <AnalyticsSection
              title="General Analytics"
              description="Overall platform performance across all tests"
              analytics={generalAnalytics}
              showTotalUsers={true}
            />
          ) : (
            <>
              {testLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-64" />
                  <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                </div>
              ) : testAnalytics ? (
                <AnalyticsSection
                  title={`Test Analytics: ${selectedTest?.name || 'Selected Test'} `}
                  description={selectedTest?.description || 'Performance metrics for this specific test'}
                  analytics={testAnalytics}
                  showTotalUsers={false}
                />
              ) : (
                <div className="p-8">
                  <p className="text-muted-foreground">No analytics data available for this test</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="student-answers" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Student Submissions</h2>
            <p className="text-muted-foreground">
              {selectedTestId === "all"
                ? "Showing all student submissions across all tests"
                : `Showing submissions for ${selectedTest?.name || 'selected test'}`}
            </p>
          </div>
          <StudentAnswersList testId={selectedTestId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
