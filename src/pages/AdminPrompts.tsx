
import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PromptDialog } from "@/components/admin/PromptDialog";
import { Prompt, PromptCategory } from "@/types/prompts";
import { useAdminPromptCategories } from "@/hooks/use-admin-prompt-categories";
import { useAdminPromptsList } from "@/hooks/use-admin-prompts-list";
import { useAdminPrompts } from "@/hooks/use-admin-prompts";
import { AdminPromptsHeader } from "@/components/admin/AdminPromptsHeader";
import { AdminPromptsTabs } from "@/components/admin/AdminPromptsTabs";

export default function AdminPrompts() {
  const [activeTab, setActiveTab] = useState<string>("categories");
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'category-add' | 'category-edit' | 'prompt-add' | 'prompt-edit'>('category-add');
  
  const { categories } = useAdminPromptCategories();
  const { prompts, isLoading } = useAdminPromptsList();
  const { deleteCategory, deletePrompt } = useAdminPrompts();

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
      <AdminPromptsHeader 
        title="Manage Prompts" 
        description="Create and manage AI prompt categories and prompts" 
      />

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
