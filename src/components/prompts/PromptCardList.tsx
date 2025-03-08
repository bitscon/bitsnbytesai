
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Prompt, PromptCategory } from '@/types/prompts';
import { Copy, Check, ChevronDown, ChevronUp, Star, BookText, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SavePromptButton } from './SavePromptButton';
import { useAuth } from '@/context/auth';

export interface PromptCardListProps {
  prompt: Prompt;
  category?: PromptCategory;
}

export function PromptCardList({ prompt, category }: PromptCardListProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    
    toast({
      title: "Copied to clipboard",
      description: "The prompt has been copied to your clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const getDifficultyColor = (level: string) => {
    switch(level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get first few lines of the prompt for preview
  const previewText = prompt.prompt_text.split('\n').slice(0, 2).join('\n');
  const shouldTruncate = prompt.prompt_text.length > 120;
  const displayText = shouldTruncate 
    ? `${prompt.prompt_text.substring(0, 120)}...` 
    : prompt.prompt_text;

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Left side - category + difficulty */}
          <div className="min-w-20 pt-1 hidden sm:block">
            <div className="space-y-2">
              <Badge variant="outline" className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                getDifficultyColor(prompt.difficulty_level)
              )}>
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
            {/* Mobile version of category/difficulty */}
            <div className="flex items-center gap-2 sm:hidden mb-2">
              <Badge variant="outline" className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                getDifficultyColor(prompt.difficulty_level)
              )}>
                {prompt.difficulty_level}
              </Badge>
              
              {category && (
                <span className="text-xs text-muted-foreground">
                  {category.name}
                </span>
              )}
            </div>

            {/* Prompt preview with copy button */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold line-clamp-2 text-base">
                {previewText}
              </h3>
              <div className="flex items-center gap-1 shrink-0">
                {user && (
                  <SavePromptButton 
                    prompt={prompt} 
                    size="sm" 
                    showText={false}
                    className="h-8 w-8"
                  />
                )}
                <Button
                  size="sm"
                  variant={copied ? "default" : "outline"}
                  onClick={handleCopy}
                  className="shrink-0 h-8 w-8 p-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Optional image - smaller in list view */}
            {prompt.image_url && (
              <div className="my-2">
                <img 
                  src={prompt.image_url}
                  alt={`Illustration for ${category?.name || ''} prompt`}
                  className="rounded-md w-24 h-24 object-cover"
                />
              </div>
            )}
            
            {/* Expand/collapse button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full flex justify-between hover:bg-accent/50 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="flex items-center">
                {expanded ? 
                  (<><ChevronUp className="h-3 w-3 mr-1" /> Hide details</>) : 
                  (<><ChevronDown className="h-3 w-3 mr-1" /> View full prompt</>)
                }
              </span>
              {expanded ? 
                <MessageSquare className="h-4 w-4 text-primary/70" /> : 
                <BookText className="h-4 w-4 text-primary/70" />
              }
            </Button>
            
            {/* Expanded content */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 overflow-hidden pt-2"
                >
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1 text-primary/70" />
                      Full Prompt:
                    </h4>
                    <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap border border-muted-foreground/10">
                      {prompt.prompt_text}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold flex items-center">
                      <Star className="h-3 w-3 mr-1 text-amber-500" />
                      Why This Works:
                    </h4>
                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-md text-sm text-muted-foreground">
                      {prompt.why_it_works}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
