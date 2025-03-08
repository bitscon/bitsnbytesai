
import React, { useState, useEffect } from 'react';
import { usePrompts } from '@/hooks/use-prompts';
import { Card } from '@/components/ui/card';
import { PromptCategoryCard } from './PromptCategoryCard';
import { DifficultyFilter } from './DifficultyFilter';
import { Input } from '@/components/ui/input';
import { DifficultyLevel } from '@/types/prompts';
import { useDebounce } from '@/hooks/use-debounce';
import { Loader2, Search, Tag, Bookmark } from 'lucide-react';
import { VirtualizedPromptGrid } from './VirtualizedPromptGrid';
import { VirtualizedPromptList } from './VirtualizedPromptList';
import { PromptSkeleton } from './PromptSkeleton';
import { ViewToggle, ViewMode } from './ViewToggle';
import { useAuth } from '@/context/auth';
import { useSavedPrompts } from '@/hooks/use-saved-prompts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PromptLibrary() {
  const { prompts, categories, isLoading } = usePrompts();
  const { savedPrompts, isLoading: isSavedPromptsLoading } = useSavedPrompts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const debouncedCategory = useDebounce(selectedCategory, 300);
  const { user } = useAuth();

  useEffect(() => {
    if (debouncedCategory !== selectedCategory) {
      setIsChangingCategory(true);
    } else {
      setIsChangingCategory(false);
    }
  }, [debouncedCategory, selectedCategory]);

  // Get saved prompt IDs for filtering
  const savedPromptIds = savedPrompts.map(sp => sp.prompt_id);
  
  // Filter prompts based on selected tab
  const displayPrompts = activeTab === 'all' 
    ? prompts 
    : prompts.filter(prompt => savedPromptIds.includes(prompt.id));

  const filteredPrompts = displayPrompts
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

  const handleDifficultyChange = (difficulty: DifficultyLevel | null) => {
    setSelectedDifficulty(difficulty);
  };

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
      {user && (
        <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as 'all' | 'saved')}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Prompts</TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1">
              <Bookmark className="h-4 w-4" />
              Saved Prompts
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

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
            onChange={handleDifficultyChange}
          />
        </div>
      </div>

      {categories.length > 0 && activeTab === 'all' && (
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
        <h3 className="text-lg font-medium mb-3">
          {activeTab === 'saved' ? 'Saved Prompts' : 'Prompts'}
        </h3>
        {isChangingCategory || (activeTab === 'saved' && isSavedPromptsLoading) ? (
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
              {activeTab === 'saved' ? 
                "You haven't saved any prompts yet." : 
                debouncedSearchTerm || selectedCategory || selectedDifficulty
                  ? "No prompts match your current filters. Try adjusting your search or filters."
                  : "No prompts available yet."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
