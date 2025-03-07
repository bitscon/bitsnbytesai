
import React from 'react';
import { Card } from '@/components/ui/card';
import { PromptCategory } from '@/types/prompts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
          "cursor-pointer p-6 text-center transition-all duration-300",
          isActive ? "bg-primary text-primary-foreground border-primary shadow-md" : "hover:border-primary/50"
        )}
        onClick={onClick}
      >
        <h3 className="text-lg font-semibold">{category.name}</h3>
      </Card>
    </motion.div>
  );
}
