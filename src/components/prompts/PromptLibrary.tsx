
import React from 'react';
import { usePrompts } from '@/hooks/use-prompts';
import { PromptCategoryCard } from './PromptCategoryCard';
import { PromptCard } from './PromptCard';
import { DifficultyFilter } from './DifficultyFilter';
import { Skeleton } from '@/components/ui/skeleton';

export function PromptLibrary() {
  const { 
    categories, 
    prompts, 
    selectedCategory, 
    selectedDifficulty, 
    isLoading,
    setSelectedCategory, 
    setSelectedDifficulty 
  } = usePrompts();

  // Find the current category name
  const currentCategory = categories.find(cat => cat.id === selectedCategory)?.name || '';

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-4">AI Prompts Library</h2>
      
      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((category) => (
          <PromptCategoryCard 
            key={category.id}
            category={category}
            isActive={category.id === selectedCategory}
            onClick={() => setSelectedCategory(category.id)}
          />
        ))}
        
        {/* Loading skeleton for categories */}
        {categories.length === 0 && (
          <>
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </>
        )}
      </div>
      
      {/* Selected category prompts */}
      {selectedCategory && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-medium">{currentCategory} Prompts</h3>
            <DifficultyFilter 
              selectedDifficulty={selectedDifficulty}
              onChange={setSelectedDifficulty}
            />
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-[120px] w-full" />
              <Skeleton className="h-[120px] w-full" />
              <Skeleton className="h-[120px] w-full" />
              <Skeleton className="h-[120px] w-full" />
            </div>
          ) : prompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground">
                {selectedDifficulty 
                  ? `No ${selectedDifficulty} prompts found in this category` 
                  : "No prompts found in this category"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
