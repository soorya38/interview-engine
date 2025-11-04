import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileQuestion, Trash2, Edit, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema, type InsertQuestion, type Question, type TopicCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminQuestions() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const { data: topicCategories } = useQuery<TopicCategory[]>({
    queryKey: ["/api/topic-categories"],
  });

  const { data: questions, isLoading } = useQuery<(Question & { topicCategoryName?: string })[]>({
    queryKey: ["/api/questions"],
  });

  // Filter questions based on search query, topic, and difficulty
  const filteredQuestions = useMemo(() => {
    if (!questions) return [];
    
    let filtered = questions;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(question => 
        question.questionText.toLowerCase().includes(query) ||
        (question.topicCategoryName && question.topicCategoryName.toLowerCase().includes(query))
      );
    }
    
    // Filter by topic category
    if (selectedTopic !== "all") {
      filtered = filtered.filter(question => question.topicCategoryId === selectedTopic);
    }
    
    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(question => question.difficulty === selectedDifficulty);
    }
    
    return filtered;
  }, [questions, searchQuery, selectedTopic, selectedDifficulty]);

  const form = useForm<InsertQuestion>({
    resolver: zodResolver(insertQuestionSchema),
    defaultValues: {
      topicCategoryId: "",
      questionText: "",
      difficulty: "medium",
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      if (editingQuestion) {
        return await apiRequest("PUT", `/api/questions/${editingQuestion.id}`, data);
      }
      return await apiRequest("POST", "/api/questions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: editingQuestion ? "Question updated" : "Question created",
        description: editingQuestion ? "Question has been updated" : "New question has been added",
      });
      setDialogOpen(false);
      setEditingQuestion(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save question",
        description: error.message,
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/questions/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Question deleted",
        description: "Question has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete question",
        description: error.message,
      });
    },
  });

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    form.setValue("topicCategoryId", question.topicCategoryId);
    form.setValue("questionText", question.questionText);
    form.setValue("difficulty", question.difficulty);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingQuestion(null);
    form.reset();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-success/10 text-success";
      case "medium":
        return "bg-warning/10 text-warning";
      case "hard":
        return "bg-destructive/10 text-destructive";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-foreground mb-2">
            Manage Questions
          </h1>
          <p className="text-muted-foreground">
            Build your question bank
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingQuestion(null)} data-testid="button-add-question">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? "Update question details" : "Create a new question"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createQuestionMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="topicCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-topic-category">
                            <SelectValue placeholder="Select a topic category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {topicCategories?.map((topicCategory) => (
                            <SelectItem key={topicCategory.id} value={topicCategory.id}>
                              {topicCategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="questionText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the question..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-question"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-difficulty">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createQuestionMutation.isPending} data-testid="button-save-question">
                    {createQuestionMutation.isPending ? "Saving..." : editingQuestion ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search questions by text or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by topic category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topic Categories</SelectItem>
              {topicCategories?.map((topicCategory) => (
                <SelectItem key={topicCategory.id} value={topicCategory.id}>
                  {topicCategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {(searchQuery || selectedTopic !== "all" || selectedDifficulty !== "all") && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filteredQuestions.length} of {questions?.length || 0} questions
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedTopic("all");
                setSelectedDifficulty("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {questions && questions.length > 0 ? (
        <div className="space-y-3">
          {filteredQuestions.map((question) => (
            <Card key={question.id} data-testid={`question-card-${question.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{question.topicCategoryName}</Badge>
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="text-foreground text-base">
                      {question.questionText}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(question)}
                      data-testid={`button-edit-${question.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteQuestionMutation.mutate(question.id)}
                      disabled={deleteQuestionMutation.isPending}
                      data-testid={`button-delete-${question.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredQuestions.length === 0 && (searchQuery || selectedTopic !== "all" || selectedDifficulty !== "all") ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No questions found</p>
            <p className="text-sm">Try adjusting your search terms or filters</p>
          </div>
        </Card>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No questions yet</p>
            <p className="text-sm">
              {!topicCategories || topicCategories.length === 0
                ? "Create topic categories first, then add questions"
                : "Click 'Add Question' to create your first question"}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
