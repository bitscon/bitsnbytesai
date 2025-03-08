
import React from 'react';
import { Card } from '@/components/ui/card';
import { PromptCategory } from '@/types/prompts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Code, 
  Image, 
  MessageSquare, 
  Pencil, 
  Sparkles, 
  Terminal, 
  LucideIcon,
  Palette,
  BookText,
  PenTool,
  Search,
  BarChart3,
  Bot
} from 'lucide-react';

interface PromptCategoryCardProps {
  category: PromptCategory;
  isActive: boolean;
  onClick: () => void;
}

// Map of category names to appropriate icons
const categoryIconMap: Record<string, LucideIcon> = {
  "Writing": Pencil,
  "Creative": Sparkles,
  "Coding": Code,
  "Technical": Terminal,
  "Academic": BookText,
  "Visual": Image,
  "Design": Palette,
  "Art": PenTool,
  "Research": Search,
  "Analytics": BarChart3,
  "AI": Bot,
  "Chat": MessageSquare,
};

export function PromptCategoryCard({ category, isActive, onClick }: PromptCategoryCardProps) {
  // Pick icon based on category name, or default to BookOpen
  const CategoryIcon = category.name && categoryIconMap[category.name] 
    ? categoryIconMap[category.name] 
    : BookOpen;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "cursor-pointer p-5 text-center transition-all duration-300 relative overflow-hidden h-full",
          isActive 
            ? "bg-primary text-primary-foreground border-primary shadow-md" 
            : "hover:border-primary/50 hover:shadow-sm",
          "group" // Add group class for hover effects
        )}
        onClick={onClick}
      >
        <div className="flex flex-col items-center justify-center space-y-3 h-full">
          <div className={cn(
            "relative transition-all duration-300 size-10 flex items-center justify-center rounded-full",
            isActive ? "bg-primary-foreground/20" : "bg-primary/5 group-hover:bg-primary/10"
          )}>
            <CategoryIcon 
              className={cn(
                "size-5 transition-all duration-300",
                isActive ? "text-primary-foreground" : "text-primary/70 group-hover:text-primary"
              )} 
            />
          </div>
          
          <h3 className={cn(
            "text-lg font-semibold transition-all duration-300",
            !isActive && "group-hover:text-primary"
          )}>
            {category.name}
          </h3>
          
          {/* Background sparkles effect on hover/active */}
          {isActive && (
            <motion.div 
              className="absolute inset-0 bg-primary/10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {/* Subtle gradients on hover */}
          <div className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-300 bg-gradient-to-tr from-primary/5 to-transparent",
            !isActive && "group-hover:opacity-100"
          )} />
        </div>
      </Card>
    </motion.div>
  );
}
