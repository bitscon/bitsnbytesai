
import React from 'react';
import { Card } from '@/components/ui/card';
import { PromptCategory } from '@/types/prompts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface PromptCategoryCardProps {
  category: PromptCategory;
  isActive: boolean;
  onClick: () => void;
}

export function PromptCategoryCard({ category, isActive, onClick }: PromptCategoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "cursor-pointer p-6 text-center transition-all duration-300 relative overflow-hidden h-full",
          isActive 
            ? "bg-primary text-primary-foreground border-primary shadow-md" 
            : "hover:border-primary/50 hover:shadow-sm"
        )}
        onClick={onClick}
      >
        <div className="flex flex-col items-center justify-center space-y-3 h-full">
          <BookOpen 
            className={cn(
              "size-8",
              isActive ? "text-primary-foreground" : "text-primary/70"
            )} 
          />
          <h3 className="text-lg font-semibold">{category.name}</h3>
          
          {isActive && (
            <motion.div 
              className="absolute inset-0 bg-primary/10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
}
