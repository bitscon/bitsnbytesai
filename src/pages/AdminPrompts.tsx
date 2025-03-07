
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { PromptForm } from "@/components/admin/PromptForm";
import { supabase } from "@/integrations/supabase/client";
import { PromptCategory, Prompt } from "@/types/prompts";
import { useAdminPrompts } from "@/hooks/use-admin-prompts";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash,
  FileText,
  FolderPlus,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPrompts() {
  const [activeTab, setActiveTab] = useState<string>("categories");
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'category-add' | 'category-edit' | 'prompt-add' | 'prompt-edit'>('category-add');
  
  const { deleteCategory, deletePrompt } = useAdminPrompts();
  const { toast } = useToast();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('prompt_categories')
          .select('*')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        setCategories(data as PromptCategory[]);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Failed to load categories',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    fetchCategories();
  }, [toast]);

  // Fetch prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select(`
            *,
            prompt_categories (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setPrompts(data as any[]);
      } catch (error) {
        console.error('Error fetching prompts:', error);
        toast({
          title: 'Failed to load prompts',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    const categoriesSubscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'prompt_categories' 
        },
        () => {
          // Refetch categories when there are changes
          const fetchCategories = async () => {
            const { data, error } = await supabase
              .from('prompt_categories')
              .select('*')
              .order('name');
            
            if (error) {
              console.error('Error fetching categories:', error);
              return;
            }
            
            setCategories(data as PromptCategory[]);
          };
          
          fetchCategories();
        }
      )
      .subscribe();

    const promptsSubscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'prompts' 
        },
        () => {
          // Refetch prompts when there are changes
          const fetchPrompts = async () => {
            const { data, error } = await supabase
              .from('prompts')
              .select(`
                *,
                prompt_categories (
                  id,
                  name
                )
              `)
              .order('created_at', { ascending: false });
            
            if (error) {
              console.error('Error fetching prompts:', error);
              return;
            }
            
            setPrompts(data as any[]);
          };
          
          fetchPrompts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(categoriesSubscription);
      supabase.removeChannel(promptsSubscription);
    };
  }, []);

  const handleAddCategory = () => {
    setDialogType('category-add');
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleEditCategory = (category: PromptCategory) => {
    setDialogType('category-edit');
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleDeleteCategory = async (category: PromptCategory) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}" category? This will also delete all prompts in this category.`)) {
      await deleteCategory(category.id, category.name);
    }
  };

  const handleAddPrompt = () => {
    setDialogType('prompt-add');
    setSelectedPrompt(null);
    setDialogOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setDialogType('prompt-edit');
    setSelectedPrompt(prompt);
    setDialogOpen(true);
  };

  const handleDeletePrompt = async (prompt: Prompt) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      await deletePrompt(prompt.id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setSelectedPrompt(null);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Prompts</h1>
        <p className="text-muted-foreground mt-2">Create and manage AI prompt categories and prompts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            {activeTab === 'categories' ? (
              <Button onClick={handleAddCategory}>
                <FolderPlus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            ) : (
              <Button onClick={handleAddPrompt}>
                <FileText className="mr-2 h-4 w-4" /> Add Prompt
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <div className="divide-y">
                  {categories.map((category) => (
                    <div key={category.id} className="py-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(category.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No categories found</p>
                  <Button onClick={handleAddCategory} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              {prompts.length > 0 ? (
                <div className="divide-y">
                  {prompts.map((prompt: any) => (
                    <div key={prompt.id} className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className={cn(
                              "px-2 py-1 text-xs rounded-full",
                              prompt.difficulty_level === "Beginner" && "bg-green-100 text-green-800",
                              prompt.difficulty_level === "Intermediate" && "bg-blue-100 text-blue-800",
                              prompt.difficulty_level === "Advanced" && "bg-purple-100 text-purple-800",
                            )}>
                              {prompt.difficulty_level}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {prompt.prompt_categories?.name}
                            </span>
                          </div>
                          <h3 className="font-medium">
                            {prompt.prompt_text.substring(0, 100)}
                            {prompt.prompt_text.length > 100 ? '...' : ''}
                          </h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPrompt(prompt)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeletePrompt(prompt)}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No prompts found</p>
                  <Button onClick={handleAddPrompt} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Add Prompt
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Adding/Editing Categories and Prompts */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'category-add' && 'Add Category'}
              {dialogType === 'category-edit' && 'Edit Category'}
              {dialogType === 'prompt-add' && 'Add Prompt'}
              {dialogType === 'prompt-edit' && 'Edit Prompt'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogType.startsWith('category') ? (
            <CategoryForm
              category={selectedCategory || undefined}
              onSuccess={handleDialogClose}
              onCancel={handleDialogClose}
            />
          ) : (
            <PromptForm
              prompt={selectedPrompt || undefined}
              categories={categories}
              onSuccess={handleDialogClose}
              onCancel={handleDialogClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
