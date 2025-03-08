
import React, { useState, useEffect } from 'react';
import { usePrompts } from '@/hooks/use-prompts';
import { Card } from '@/components/ui/card';
import { PromptCategoryCard } from './PromptCategoryCard';
import { DifficultyFilter } from './DifficultyFilter';
import { Input } from '@/components/ui/input';
import { DifficultyLevel } from '@/types/prompts';
import { useDebounce } from '@/hooks/use-debounce';
import { Loader2, Search, Tag } from 'lucide-react';
import { VirtualizedPromptGrid } from './VirtualizedPromptGrid';
import { VirtualizedPromptList } from './VirtualizedPromptList';
import { PromptSkeleton } from './PromptSkeleton';
import { ViewToggle, ViewMode } from './ViewToggle';

export function PromptLibrary() {
  const { categories, prompts, isLoading } = usePrompts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const debouncedCategory = useDebounce(selectedCategory, 300);

  useEffect(() => {
    if (debouncedCategory !== selectedCategory) {
      setIsChangingCategory(true);
    } else {
      setIsChangingCategory(false);
    }
  }, [debouncedCategory, selectedCategory]);

  const filteredPrompts = prompts
    .filter(prompt => !selectedCategory || prompt.category_id === selectedCategory)
    .filter(prompt => !selectedDifficulty || prompt.difficulty_level === selectedDifficulty)
    .filter(prompt => {
      if (!debouncedSearchTerm) return true;
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        prompt.prompt_text.toLowerCase().includes(searchLower) ||
        prompt.why_it_works.toLowerCase().includes(searchLower)
      );
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading prompts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex gap-2 items-center">
          <ViewToggle 
            viewMode={viewMode} 
            onChange={setViewMode} 
          />
          <DifficultyFilter 
            selectedDifficulty={selectedDifficulty}
            onChange={setSelectedDifficulty}
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            Categories
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map((category) => (
              <PromptCategoryCard
                key={category.id}
                category={category}
                isActive={selectedCategory === category.id}
                onClick={() => {
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  );
                  setIsChangingCategory(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium mb-3">Prompts</h3>
        {isChangingCategory ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <PromptSkeleton key={index} />
            ))}
          </div>
        ) : filteredPrompts.length > 0 ? (
          viewMode === 'grid' ? (
            <VirtualizedPromptGrid
              prompts={filteredPrompts}
              categories={categories}
            />
          ) : (
            <VirtualizedPromptList
              prompts={filteredPrompts}
              categories={categories}
            />
          )
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              {debouncedSearchTerm || selectedCategory || selectedDifficulty
                ? "No prompts match your current filters. Try adjusting your search or filters."
                : "No prompts available yet."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
