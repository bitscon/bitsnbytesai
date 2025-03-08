
import React from 'react';
import { PromptCategory } from '@/types/prompts';
import { PromptCategoryCard } from '../PromptCategoryCard';
import { Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface CategoryGridProps {
  categories: PromptCategory[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function CategoryGrid({ categories, selectedCategory, onCategoryChange }: CategoryGridProps) {
  return (
    <motion.div
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
            onClick={() => onCategoryChange(category.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}
