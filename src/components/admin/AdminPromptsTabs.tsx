
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptCategoryList } from "@/components/admin/PromptCategoryList";
import { PromptList } from "@/components/admin/PromptList";
import { Prompt, PromptCategory } from "@/types/prompts";
import { FileText, FolderPlus } from "lucide-react";

interface AdminPromptsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  categories: PromptCategory[];
  prompts: Prompt[];
  onAddCategory: () => void;
  onEditCategory: (category: PromptCategory) => void;
  onDeleteCategory: (category: PromptCategory) => void;
  onAddPrompt: () => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (prompt: Prompt) => void;
}

export function AdminPromptsTabs({
  activeTab,
  setActiveTab,
  categories,
  prompts,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddPrompt,
  onEditPrompt,
  onDeletePrompt,
}: AdminPromptsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
        </TabsList>

        <div className="flex space-x-2">
          {activeTab === 'categories' ? (
            <Button onClick={onAddCategory}>
              <FolderPlus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          ) : (
            <Button onClick={onAddPrompt}>
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
              onAddCategory={onAddCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
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
              onAddPrompt={onAddPrompt}
              onEditPrompt={onEditPrompt}
              onDeletePrompt={onDeletePrompt}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
