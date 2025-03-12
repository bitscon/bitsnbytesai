
import React, { useState, useEffect } from 'react';
import { usePrompts } from '@/hooks/use-prompts';
import { Loader2 } from 'lucide-react';
import { DifficultyLevel } from '@/types/prompts';
import { useDebounce } from '@/hooks/use-debounce';
import { ViewMode } from './ViewToggle';
import { useAuth } from '@/context/auth';
import { useSavedPrompts } from '@/hooks/use-saved-prompts';
import { AnimatePresence } from 'framer-motion';
import { TabsNavigator } from './navigation/TabsNavigator';
import { SearchBar } from './filters/SearchBar';
import { CategoryGrid } from './categories/CategoryGrid';
import { PromptResultsView } from './results/PromptResultsView';

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
  const { user } = useAuth();
  
  // Get saved prompt IDs for filtering - moved this up before its use
  const savedPromptIds = savedPrompts.map(sp => sp.prompt_id);

  // Filter prompts based on selected category, difficulty, and search term
  const filteredPrompts = React.useMemo(() => {
    // First, filter prompts based on active tab
    const displayPrompts = activeTab === 'all' 
      ? prompts 
      : prompts.filter(prompt => savedPromptIds.includes(prompt.id));
    
    // Then apply other filters
    return displayPrompts
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
  }, [
    activeTab, 
    prompts, 
    savedPromptIds, 
    selectedCategory, 
    selectedDifficulty, 
    debouncedSearchTerm
  ]);

  // Monitor category changes for animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChangingCategory(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedCategory]);
  
  const handleDifficultyChange = (difficulty: DifficultyLevel | null) => {
    setSelectedDifficulty(difficulty);
  };

  const handleCategoryChange = (categoryId: string | null) => {
    if (categoryId !== selectedCategory) {
      setIsChangingCategory(true);
      setSelectedCategory(categoryId);
    } else {
      setSelectedCategory(null);
    }
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

  return (
    <div className="space-y-6">
      {user && (
        <TabsNavigator
          activeTab={activeTab}
          viewMode={viewMode}
          selectedCategory={selectedCategory}
          selectedDifficulty={selectedDifficulty}
          searchTerm={searchTerm}
          categories={categories}
          onTabChange={setActiveTab}
          onViewModeChange={setViewMode}
          onCategoryChange={handleCategoryChange}
          onDifficultyChange={handleDifficultyChange}
          onSearchChange={setSearchTerm}
          onClearFilters={clearFilters}
        />
      )}

      <SearchBar 
        searchTerm={searchTerm}
        onChange={setSearchTerm}
      />

      <AnimatePresence mode="wait">
        {(searchTerm || selectedCategory || selectedDifficulty || activeTab === 'saved') ? (
          <PromptResultsView
            activeTab={activeTab}
            filteredPrompts={filteredPrompts}
            categories={categories}
            selectedCategory={selectedCategory}
            isChangingCategory={isChangingCategory}
            isSavedPromptsLoading={isSavedPromptsLoading}
            viewMode={viewMode}
            onClearFilters={clearFilters}
          />
        ) : (
          <CategoryGrid
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
