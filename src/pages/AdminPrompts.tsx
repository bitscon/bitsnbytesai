
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptDialog } from "@/components/admin/PromptDialog";
import { PromptCategoryList } from "@/components/admin/PromptCategoryList";
import { PromptList } from "@/components/admin/PromptList";
import { supabase } from "@/integrations/supabase/client";
import { PromptCategory, Prompt } from "@/types/prompts";
import { useAdminPrompts } from "@/hooks/use-admin-prompts";
import { useToast } from "@/hooks/use-toast";
import { FileText, FolderPlus } from "lucide-react";

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
              <PromptCategoryList
                categories={categories}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              <PromptList
                prompts={prompts}
                onAddPrompt={handleAddPrompt}
                onEditPrompt={handleEditPrompt}
                onDeletePrompt={handleDeletePrompt}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Adding/Editing Categories and Prompts */}
      <PromptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dialogType={dialogType}
        selectedCategory={selectedCategory}
        selectedPrompt={selectedPrompt}
        categories={categories}
        onDialogClose={handleDialogClose}
      />
    </AdminLayout>
  );
}
