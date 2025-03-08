
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Tag } from 'lucide-react';
import { ViewMode } from '../ViewToggle';
import { motion } from 'framer-motion';
import { PromptSkeleton } from '../PromptSkeleton';
import { VirtualizedPromptGrid } from '../VirtualizedPromptGrid';
import { VirtualizedPromptList } from '../VirtualizedPromptList';
import { Prompt, PromptCategory } from '@/types/prompts';

interface PromptResultsViewProps {
  activeTab: 'all' | 'saved';
  filteredPrompts: Prompt[];
  categories: PromptCategory[];
  selectedCategory: string | null;
  isChangingCategory: boolean;
  isSavedPromptsLoading: boolean;
  viewMode: ViewMode;
  onClearFilters: () => void;
}

export function PromptResultsView({
  activeTab,
  filteredPrompts,
  categories,
  selectedCategory,
  isChangingCategory,
  isSavedPromptsLoading,
  viewMode,
  onClearFilters
}: PromptResultsViewProps) {
  return (
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
            {activeTab === 'saved' ? 'Favorites' : 'Results'}
          </h3>
          
          {selectedCategory && (
            <Button 
              onClick={onClearFilters}
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
              "You haven't added any favorites yet." : 
              "No prompts match your current filters. Try adjusting your search or filters."}
          </p>
        </Card>
      )}
    </motion.div>
  );
}
