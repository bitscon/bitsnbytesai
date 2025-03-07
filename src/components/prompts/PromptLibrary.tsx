
import React from 'react';
import { usePrompts } from '@/hooks/use-prompts';
import { PromptCategoryCard } from './PromptCategoryCard';
import { PromptCard } from './PromptCard';
import { DifficultyFilter } from './DifficultyFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PromptLibrary() {
  const { 
    categories, 
    prompts, 
    selectedCategory, 
    selectedDifficulty, 
    isLoading,
    setSelectedCategory, 
    setSelectedDifficulty,
    searchTerm,
    setSearchTerm
  } = usePrompts();

  // Find the current category name
  const currentCategory = categories.find(cat => cat.id === selectedCategory)?.name || '';

  return (
    <div className="space-y-8">
      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <PromptCategoryCard 
                category={category}
                isActive={category.id === selectedCategory}
                onClick={() => setSelectedCategory(category.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
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
      <AnimatePresence mode="wait">
        {selectedCategory && (
          <motion.div 
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-medium flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                {currentCategory} Prompts
              </h3>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search prompts..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <DifficultyFilter 
                    selectedDifficulty={selectedDifficulty}
                    onChange={setSelectedDifficulty}
                  />
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
              </div>
            ) : prompts.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial="initial"
                animate="animate"
                variants={{
                  animate: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {prompts.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 border border-dashed rounded-lg"
              >
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? `No results found for "${searchTerm}"`
                    : selectedDifficulty 
                      ? `No ${selectedDifficulty} prompts found in this category` 
                      : "No prompts found in this category"}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
