
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark } from 'lucide-react';
import { ViewToggle, ViewMode } from '../ViewToggle';
import { FilterSheet } from '../filters/FilterSheet';
import { PromptCategory, DifficultyLevel } from '@/types/prompts';

interface TabsNavigatorProps {
  activeTab: 'all' | 'saved';
  viewMode: ViewMode;
  selectedCategory: string | null;
  selectedDifficulty: DifficultyLevel | null;
  searchTerm: string;
  categories: PromptCategory[];
  onTabChange: (tab: 'all' | 'saved') => void;
  onViewModeChange: (mode: ViewMode) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onDifficultyChange: (difficulty: DifficultyLevel | null) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

export function TabsNavigator({
  activeTab,
  viewMode,
  selectedCategory,
  selectedDifficulty,
  searchTerm,
  categories,
  onTabChange,
  onViewModeChange,
  onCategoryChange,
  onDifficultyChange,
  onSearchChange,
  onClearFilters
}: TabsNavigatorProps) {
  return (
    <Tabs defaultValue={activeTab} onValueChange={(value) => onTabChange(value as 'all' | 'saved')}>
      <div className="flex items-center justify-between mb-4">
        <TabsList className="h-10">
          <TabsTrigger value="all" className="px-4 py-2">All Prompts</TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-1 px-4 py-2">
            <Bookmark className="h-4 w-4" />
            Favorites
          </TabsTrigger>
        </TabsList>
        
        <div className="flex gap-2">
          <FilterSheet 
            categories={categories}
            selectedCategory={selectedCategory}
            selectedDifficulty={selectedDifficulty}
            searchTerm={searchTerm}
            onCategoryChange={onCategoryChange}
            onDifficultyChange={onDifficultyChange}
            onSearchChange={onSearchChange}
            onClearFilters={onClearFilters}
          />
          
          <ViewToggle 
            viewMode={viewMode} 
            onChange={onViewModeChange} 
          />
        </div>
      </div>
    </Tabs>
  );
}
