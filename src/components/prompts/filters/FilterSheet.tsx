
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal, X, Search, Tag } from 'lucide-react';
import { DifficultyLevel } from '@/types/prompts';
import { DifficultyFilter } from '../DifficultyFilter';
import { PromptCategory } from '@/types/prompts';

interface FilterSheetProps {
  categories: PromptCategory[];
  selectedCategory: string | null;
  selectedDifficulty: DifficultyLevel | null;
  searchTerm: string;
  onCategoryChange: (categoryId: string | null) => void;
  onDifficultyChange: (difficulty: DifficultyLevel | null) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

export function FilterSheet({
  categories,
  selectedCategory,
  selectedDifficulty,
  searchTerm,
  onCategoryChange,
  onDifficultyChange,
  onSearchChange,
  onClearFilters
}: FilterSheetProps) {
  const hasActiveFilters = selectedCategory || selectedDifficulty || searchTerm;

  return (
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
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Difficulty</h4>
            <DifficultyFilter 
              selectedDifficulty={selectedDifficulty}
              onChange={onDifficultyChange}
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
                  onClick={() => onCategoryChange(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <Button 
              onClick={onClearFilters}
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
  );
}
