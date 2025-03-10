
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptCategoryList } from "@/components/admin/PromptCategoryList";
import { PromptList } from "@/components/admin/PromptList";
import { Prompt, PromptCategory } from "@/types/prompts";
import { FileText, FolderPlus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  isLoading?: boolean;
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
  isLoading = false,
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
            <Button onClick={onAddCategory} disabled={isLoading}>
              <FolderPlus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          ) : (
            <Button onClick={onAddPrompt} disabled={isLoading}>
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
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div className="py-3 flex justify-between items-center" key={i}>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <PromptCategoryList
                categories={categories}
                onAddCategory={onAddCategory}
                onEditCategory={onEditCategory}
                onDeleteCategory={onDeleteCategory}
              />
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
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div className="py-4" key={i}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <PromptList
                prompts={prompts}
                onAddPrompt={onAddPrompt}
                onEditPrompt={onEditPrompt}
                onDeletePrompt={onDeletePrompt}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
