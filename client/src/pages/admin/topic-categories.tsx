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
import { Plus, Edit, Trash2, Tag, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTopicCategorySchema, type InsertTopicCategory, type TopicCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";


export default function AdminTopicCategories() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopicCategory, setEditingTopicCategory] = useState<TopicCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: topicCategories, isLoading } = useQuery<TopicCategory[]>({
    queryKey: ["/api/topic-categories"],
  });

  // Filter topic categories based on search query
  const filteredTopicCategories = useMemo(() => {
    if (!topicCategories) return [];
    if (!searchQuery.trim()) return topicCategories;
    
    const query = searchQuery.toLowerCase();
    return topicCategories.filter(topicCategory => 
      topicCategory.name.toLowerCase().includes(query) ||
      (topicCategory.description && topicCategory.description.toLowerCase().includes(query))
    );
  }, [topicCategories, searchQuery]);

  const form = useForm<InsertTopicCategory>({
    resolver: zodResolver(insertTopicCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      iconName: "",
    },
  });

  const createTopicCategoryMutation = useMutation({
    mutationFn: async (data: InsertTopicCategory) => {
      if (editingTopicCategory) {
        return await apiRequest("PUT", `/api/topic-categories/${editingTopicCategory.id}`, data);
      }
      return await apiRequest("POST", "/api/topic-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topic-categories"] });
      toast({
        title: editingTopicCategory ? "Topic category updated" : "Topic category created",
        description: editingTopicCategory ? "Topic category has been updated successfully" : "New topic category has been created",
      });
      setDialogOpen(false);
      setEditingTopicCategory(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save topic category",
        description: error.message,
      });
    },
  });

  const deleteTopicCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/topic-categories/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topic-categories"] });
      toast({
        title: "Topic category deleted",
        description: "Topic category has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete topic category",
        description: error.message,
      });
    },
  });

  const handleEdit = (topicCategory: TopicCategory) => {
    setEditingTopicCategory(topicCategory);
    form.setValue("name", topicCategory.name);
    form.setValue("description", topicCategory.description || "");
    form.setValue("iconName", topicCategory.iconName || "");
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTopicCategory(null);
    form.reset();
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
            Manage Topic Categories
          </h1>
          <p className="text-muted-foreground">
            Create and manage topic categories for organizing questions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTopicCategory(null)} data-testid="button-add-topic-category">
              <Plus className="h-4 w-4 mr-2" />
              Add Topic Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTopicCategory ? "Edit Topic Category" : "Add New Topic Category"}</DialogTitle>
              <DialogDescription>
                {editingTopicCategory ? "Update topic category information" : "Create a new topic category for organizing questions"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createTopicCategoryMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., JavaScript, React, Node.js" {...field} data-testid="input-category-name" />
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
                          placeholder="Describe what this category covers..."
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-category-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTopicCategoryMutation.isPending} data-testid="button-save-category">
                    {createTopicCategoryMutation.isPending ? "Saving..." : editingTopicCategory ? "Update" : "Create"}
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
            placeholder="Search topic categories by name or description..."
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
            {filteredTopicCategories.length} of {topicCategories?.length || 0} categories
          </div>
        )}
      </div>

      {topicCategories && topicCategories.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopicCategories.map((topicCategory) => (
            <Card key={topicCategory.id} data-testid={`topic-category-card-${topicCategory.id}`}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{topicCategory.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {topicCategory.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(topicCategory)}
                  data-testid={`button-edit-category-${topicCategory.id}`}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTopicCategoryMutation.mutate(topicCategory.id)}
                  disabled={deleteTopicCategoryMutation.isPending}
                  data-testid={`button-delete-category-${topicCategory.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTopicCategories.length === 0 && searchQuery ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No topic categories found</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        </Card>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No topic categories yet</p>
            <p className="text-sm">Click "Add Topic Category" to create your first category</p>
          </div>
        </Card>
      )}
    </div>
  );
}
