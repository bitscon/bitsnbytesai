
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Prompt, PromptCategory } from '@/types/prompts';
import { Copy, Check, ChevronDown, ChevronUp, Star, BookText, MessageSquare, BrainCircuit, Sparkles, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SavePromptButton } from './SavePromptButton';
import { useAuth } from '@/context/auth';

export interface PromptCardProps {
  prompt: Prompt;
  category?: PromptCategory;
}

export function PromptCard({ prompt, category }: PromptCardProps) {
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
    <Card className="overflow-hidden h-full border shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="space-y-3">
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
            
            {user && <SavePromptButton prompt={prompt} size="icon" className="h-7 w-7" />}
          </div>
          
          {/* Title and preview */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base line-clamp-2">
                {prompt.title || prompt.prompt_text.split('\n')[0]}
              </h3>
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                onClick={handleCopy}
                className="shrink-0 h-8 w-8 p-0 ml-1"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            {prompt.short_description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {prompt.short_description}
              </p>
            )}
          </div>
          
          {/* Optional image */}
          {prompt.image_url && (
            <div className="my-2">
              <img 
                src={prompt.image_url}
                alt={`Illustration for ${category?.name || ''} prompt`}
                className="rounded-md w-full h-32 object-cover"
              />
            </div>
          )}
          
          {/* Expand/collapse button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full flex justify-between hover:bg-accent/50 text-xs mt-auto"
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
                  <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap border border-muted-foreground/10 max-h-60 overflow-y-auto">
                    {prompt.prompt_text}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold flex items-center">
                    <Star className="h-3 w-3 mr-1 text-amber-500" />
                    Why This Works:
                  </h4>
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-md text-sm text-muted-foreground max-h-40 overflow-y-auto">
                    {prompt.why_it_works}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
