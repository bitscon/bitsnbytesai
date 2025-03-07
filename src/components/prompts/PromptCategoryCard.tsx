
import React from 'react';
import { Card } from '@/components/ui/card';
import { PromptCategory } from '@/types/prompts';
import { cn } from '@/lib/utils';

interface PromptCategoryCardProps {
  category: PromptCategory;
  isActive: boolean;
  onClick: () => void;
}

export function PromptCategoryCard({ category, isActive, onClick }: PromptCategoryCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer p-6 text-center transition-all duration-200 hover:scale-105",
        isActive ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold">{category.name}</h3>
    </Card>
  );
}
