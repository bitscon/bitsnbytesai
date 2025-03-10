
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PromptDialog } from "@/components/admin/PromptDialog";
import { Prompt, PromptCategory } from "@/types/prompts";
import { useAdminPromptCategories } from "@/hooks/use-admin-prompt-categories";
import { useAdminPromptsList } from "@/hooks/use-admin-prompts-list";
import { useAdminPrompts } from "@/hooks/use-admin-prompts";
import { AdminPromptsHeader } from "@/components/admin/AdminPromptsHeader";
import { AdminPromptsTabs } from "@/components/admin/AdminPromptsTabs";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminPrompts() {
  const [activeTab, setActiveTab] = useState<string>("categories");
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'category-add' | 'category-edit' | 'prompt-add' | 'prompt-edit'>('category-add');
  const [retryCount, setRetryCount] = useState(0);
  
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useAdminPromptCategories();
  const { prompts, isLoading: promptsLoading, error: promptsError } = useAdminPromptsList();
  const { deleteCategory, deletePrompt } = useAdminPrompts();

  // Force refetch when retry is clicked
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

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

  const isLoading = categoriesLoading || promptsLoading;
  const hasError = categoriesError || promptsError;

  return (
    <AdminLayout>
      <AdminPromptsHeader 
        title="Manage Prompts" 
        description="Create and manage AI prompt categories and prompts" 
      />

      {hasError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>{categoriesError?.message || promptsError?.message || "Failed to fetch data from the server."}</p>
            <p className="text-sm">This might be due to a network issue or a problem with the database connection.</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-fit flex items-center gap-2"
              onClick={handleRetry}
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <AdminPromptsTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        categories={categories}
        prompts={prompts}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddPrompt={handleAddPrompt}
        onEditPrompt={handleEditPrompt}
        onDeletePrompt={handleDeletePrompt}
        isLoading={isLoading}
      />

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
