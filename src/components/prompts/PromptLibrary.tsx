
import React, { useState, useEffect } from 'react';
import { usePrompts } from '@/hooks/use-prompts';
import { Card } from '@/components/ui/card';
import { PromptCategoryCard } from './PromptCategoryCard';
import { DifficultyFilter } from './DifficultyFilter';
import { Input } from '@/components/ui/input';
import { DifficultyLevel } from '@/types/prompts';
import { useDebounce } from '@/hooks/use-debounce';
import { Loader2, Search, Tag, Bookmark, Filter, X, SlidersHorizontal } from 'lucide-react';
import { VirtualizedPromptGrid } from './VirtualizedPromptGrid';
import { VirtualizedPromptList } from './VirtualizedPromptList';
import { PromptSkeleton } from './PromptSkeleton';
import { ViewToggle, ViewMode } from './ViewToggle';
import { useAuth } from '@/context/auth';
import { useSavedPrompts } from '@/hooks/use-saved-prompts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function PromptLibrary() {
  const { prompts, categories, isLoading } = usePrompts();
  const { savedPrompts, isLoading: isSavedPromptsLoading } = useSavedPrompts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [showFilters, setShowFilters] = useState(false);
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

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setIsChangingCategory(true);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading prompts...</span>
      </div>
    );
  }

  const hasActiveFilters = selectedCategory || selectedDifficulty || searchTerm;

  return (
    <div className="space-y-6">
      {user && (
        <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as 'all' | 'saved')}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="h-10">
              <TabsTrigger value="all" className="px-4 py-2">All Prompts</TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-1 px-4 py-2">
                <Bookmark className="h-4 w-4" />
                Saved Prompts
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    aria-label="Filter prompts"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {hasActiveFilters && (
                      <span className="flex h-2 w-2 rounded-full bg-primary ml-1" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] sm:w-[400px] p-6" side="right">
                  <h3 className="text-lg font-medium mb-4">Filter Prompts</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Search</h4>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search prompts..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Difficulty</h4>
                      <DifficultyFilter 
                        selectedDifficulty={selectedDifficulty}
                        onChange={handleDifficultyChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center">
                        <Tag className="mr-2 h-4 w-4" />
                        Categories
                      </h4>
                      <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-2">
                        {categories.map((category) => (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "default" : "outline"}
                            size="sm"
                            className="justify-start h-auto py-2 px-3 text-sm"
                            onClick={() => handleCategoryChange(category.id)}
                          >
                            {category.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <Button 
                        onClick={clearFilters}
                        variant="ghost" 
                        className="w-full flex items-center justify-center"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
              <ViewToggle 
                viewMode={viewMode} 
                onChange={setViewMode} 
              />
            </div>
          </div>
        </Tabs>
      )}

      <div className="relative flex-1">
        <div className="relative flex-1 w-full mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {(searchTerm || selectedCategory || selectedDifficulty || activeTab === 'saved') ? (
            <motion.div 
              key="filtered-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">
                    {activeTab === 'saved' ? 'Saved Prompts' : 'Results'}
                  </h3>
                  
                  {(selectedCategory || selectedDifficulty) && (
                    <Button 
                      onClick={clearFilters}
                      variant="ghost" 
                      size="sm"
                      className="text-sm flex items-center gap-1 h-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                      Clear filters
                    </Button>
                  )}
                </div>
                
                {selectedCategory && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </div>
                )}
              </div>
              
              {isChangingCategory || (activeTab === 'saved' && isSavedPromptsLoading) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      "No prompts match your current filters. Try adjusting your search or filters."}
                  </p>
                </Card>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="category-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                Browse Categories
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <PromptCategoryCard
                    key={category.id}
                    category={category}
                    isActive={selectedCategory === category.id}
                    onClick={() => handleCategoryChange(category.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
