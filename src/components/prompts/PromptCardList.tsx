
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Prompt, PromptCategory } from '@/types/prompts';
import { BrainCircuit, Sparkles, Zap, ArrowRight, Binary } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SavePromptButton } from './SavePromptButton';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';

export interface PromptCardListProps {
  prompt: Prompt;
  category?: PromptCategory;
}

export function PromptCardList({ prompt, category }: PromptCardListProps) {
  const { user } = useAuth();

  const getDifficultyIcon = (level: string) => {
    switch(level) {
      case 'Beginner': return <Sparkles className="h-3.5 w-3.5 mr-1" />;
      case 'Intermediate': return <Zap className="h-3.5 w-3.5 mr-1" />;
      case 'Advanced': return <BrainCircuit className="h-3.5 w-3.5 mr-1" />;
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
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200">
      <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 px-3 py-1.5 flex items-center">
        <Binary className="h-3.5 w-3.5 text-white mr-1.5" />
        <span className="text-xs text-white font-semibold tracking-tight">bits & bytes</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20 text-white ml-1.5">AI</span>
      </div>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left side - category + difficulty */}
          <div className="w-full sm:w-auto sm:min-w-24 pt-1">
            <div className="flex sm:flex-col items-center sm:items-start gap-2">
              <Badge variant="outline" className={cn(
                "px-2 py-1 text-xs font-medium rounded-full flex items-center",
                getDifficultyColor(prompt.difficulty_level)
              )}>
                {getDifficultyIcon(prompt.difficulty_level)}
                {prompt.difficulty_level}
              </Badge>
              
              {category && (
                <p className="text-xs text-muted-foreground">
                  {category.name}
                </p>
              )}
            </div>
          </div>
          
          {/* Right side - main content */}
          <div className="flex-1 space-y-2">
            {/* Title and actions */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base line-clamp-2">
                {prompt.title}
              </h3>
              <div className="flex items-center gap-1 shrink-0">
                {user && (
                  <SavePromptButton 
                    prompt={prompt} 
                    size="sm" 
                    showText={false}
                    showTooltip={false}
                    className="h-8 w-8"
                  />
                )}
              </div>
            </div>
            
            {/* Short description */}
            {prompt.short_description ? (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {prompt.short_description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground line-clamp-2 italic">
                No description available
              </p>
            )}
            
            {/* View Now button */}
            <div className="flex justify-end mt-2">
              <Button variant="ghost" size="sm" className="text-xs flex items-center">
                View Now <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
