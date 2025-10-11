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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, BookOpen, Search, X, FileQuestion } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTopicSchema, type InsertTopic, type Topic, type Question } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminTopics() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const { data: topics, isLoading } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  // Filter topics based on search query
  const filteredTopics = useMemo(() => {
    if (!topics) return [];
    if (!searchQuery.trim()) return topics;
    
    const query = searchQuery.toLowerCase();
    return topics.filter(topic => 
      topic.name.toLowerCase().includes(query) ||
      (topic.description && topic.description.toLowerCase().includes(query))
    );
  }, [topics, searchQuery]);

  const form = useForm<InsertTopic>({
    resolver: zodResolver(insertTopicSchema),
    defaultValues: {
      name: "",
      description: "",
      iconName: "BookOpen",
    },
  });

  // Filter questions based on search query
  const filteredQuestions = useMemo(() => {
    if (!questions) return [];
    return questions;
  }, [questions]);

  const createTopicMutation = useMutation({
    mutationFn: async (data: InsertTopic) => {
      const payload = {
        ...data,
        questionIds: selectedQuestions,
      };
      if (editingTopic) {
        return await apiRequest("PUT", `/api/topics/${editingTopic.id}`, payload);
      }
      return await apiRequest("POST", "/api/topics", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({
        title: editingTopic ? "Test updated" : "Test created",
        description: editingTopic ? "Test has been updated successfully" : "New test has been created",
      });
      setDialogOpen(false);
      setEditingTopic(null);
      setSelectedQuestions([]);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save test",
        description: error.message,
      });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/topics/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({
        title: "Test deleted",
        description: "Test has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete test",
        description: error.message,
      });
    },
  });

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    form.setValue("name", topic.name);
    form.setValue("description", topic.description || "");
    form.setValue("iconName", topic.iconName || "BookOpen");
    // Load existing question IDs for this topic
    setSelectedQuestions(topic.questionIds || []);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTopic(null);
    setSelectedQuestions([]);
    form.reset();
  };

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
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
            Manage Tests
          </h1>
          <p className="text-muted-foreground">
            Create and manage interview tests
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTopic(null)} data-testid="button-add-topic">
              <Plus className="h-4 w-4 mr-2" />
              Add Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTopic ? "Edit Test" : "Add New Test"}</DialogTitle>
              <DialogDescription>
                {editingTopic ? "Update test information" : "Create a new interview test"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createTopicMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., JavaScript Fundamentals" {...field} data-testid="input-topic-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this test covers..."
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-topic-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Question Selection */}
                <div className="space-y-3">
                  <FormLabel>Select Questions</FormLabel>
                  {questionsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                      {filteredQuestions.length > 0 ? (
                        filteredQuestions.map((question) => (
                          <div key={question.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50">
                            <Checkbox
                              checked={selectedQuestions.includes(question.id)}
                              onCheckedChange={() => handleQuestionToggle(question.id)}
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <FileQuestion className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="outline" className="text-xs">
                                  {question.difficulty}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium line-clamp-2">
                                {question.questionText}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No questions available</p>
                          <p className="text-xs">Create questions first to add them to tests</p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedQuestions.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTopicMutation.isPending || selectedQuestions.length === 0} 
                    data-testid="button-save-topic"
                  >
                    {createTopicMutation.isPending ? "Saving..." : editingTopic ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tests by name or description..."
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
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            {filteredTopics.length} of {topics?.length || 0} tests
          </div>
        )}
      </div>

      {topics && topics.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((topic) => (
            <Card key={topic.id} data-testid={`topic-card-${topic.id}`}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{topic.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {topic.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(topic)}
                  data-testid={`button-edit-${topic.id}`}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTopicMutation.mutate(topic.id)}
                  disabled={deleteTopicMutation.isPending}
                  data-testid={`button-delete-${topic.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTopics.length === 0 && searchQuery ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No tests found</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        </Card>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No tests yet</p>
            <p className="text-sm">Click "Add Test" to create your first interview test</p>
          </div>
        </Card>
      )}
    </div>
  );
}
