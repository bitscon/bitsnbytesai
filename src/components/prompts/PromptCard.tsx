
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Prompt, PromptCategory } from '@/types/prompts';
import { BrainCircuit, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SavePromptButton } from './SavePromptButton';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';

export interface PromptCardProps {
  prompt: Prompt;
  category?: PromptCategory;
  onClick: () => void;
}

export function PromptCard({ prompt, category, onClick }: PromptCardProps) {
  const { user } = useAuth();

  const getDifficultyIcon = (level: string) => {
    switch(level) {
      case 'Beginner': return <Sparkles className="h-3 w-3 mr-1" />;
      case 'Intermediate': return <Zap className="h-3 w-3 mr-1" />;
      case 'Advanced': return <BrainCircuit className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch(level) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="h-full overflow-visible"
    >
      <Card 
        className="h-full overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex-1 space-y-3">
            {/* Header with difficulty and category */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full flex items-center",
                  getDifficultyColor(prompt.difficulty_level)
                )}>
                  {getDifficultyIcon(prompt.difficulty_level)}
                  {prompt.difficulty_level}
                </Badge>
                
                {category && (
                  <span className="text-xs text-muted-foreground">
                    {category.name}
                  </span>
                )}
              </div>
              
              {user && <SavePromptButton prompt={prompt} size="icon" className="h-7 w-7" showTooltip={false} />}
            </div>
            
            {/* Title and preview */}
            <div className="space-y-2">
              <h3 className="font-semibold text-base line-clamp-2">
                {prompt.title}
              </h3>
              
              {prompt.short_description ? (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {prompt.short_description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground line-clamp-2 italic">
                  No description available
                </p>
              )}
            </div>
            
            {/* Optional small image */}
            {prompt.image_url && (
              <div className="mt-auto pt-2">
                <img 
                  src={prompt.image_url}
                  alt={`Illustration for ${category?.name || ''} prompt`}
                  className="rounded-md w-full h-24 object-cover"
                />
              </div>
            )}
          </div>
          
          {/* View Now button at the bottom */}
          <div className="mt-auto pt-3">
            <Button variant="ghost" size="sm" className="w-full text-xs flex items-center justify-center">
              View Now
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
