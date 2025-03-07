import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Prompt, PromptCategory } from '@/types/prompts';
import { Copy, Check, ChevronDown, ChevronUp, Star, Verified, BookText, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PromptExplanation } from './PromptExplanation';

export interface PromptCardProps {
  prompt: Prompt;
  category?: PromptCategory;
}

export function PromptCard({ prompt, category }: PromptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  const getDifficultyIcon = (level: string) => {
    switch(level) {
      case 'Beginner': return <Star className="h-3 w-3 mr-1" />;
      case 'Intermediate': return <Verified className="h-3 w-3 mr-1" />;
      case 'Advanced': return <Star className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const imageUrl = prompt.image_url || 
    `https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden h-full border-muted-foreground/20 hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className={cn(
                "inline-flex items-center px-2 py-1 text-xs rounded-full mb-2",
                getDifficultyColor(prompt.difficulty_level)
              )}>
                {getDifficultyIcon(prompt.difficulty_level)}
                {prompt.difficulty_level}
              </div>
              <h3 className="font-semibold truncate">
                {prompt.prompt_text.split(' ').slice(0, 6).join(' ')}...
              </h3>
            </div>
            <Button
              size="sm"
              variant={copied ? "default" : "outline"}
              onClick={handleCopy}
              className="gap-1"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          
          <PromptExplanation 
            explanation={prompt.explanation} 
            enabled={prompt.explanation_enabled}
          />
          
          {category && (
            <div className="mt-3 mb-2">
              <OptimizedImage 
                src={imageUrl}
                alt={`Illustration for ${category.name} prompt`}
                aspectRatio="16/9"
                className="rounded-md transition-all duration-300"
                containerClassName="rounded-md border border-muted-foreground/10"
              />
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 p-0 h-auto w-full flex justify-between hover:bg-transparent"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="text-xs text-muted-foreground flex items-center">
              {expanded ? 
                (<><ChevronUp className="h-3 w-3 mr-1 text-muted-foreground" /> Hide details</>) : 
                (<><ChevronDown className="h-3 w-3 mr-1 text-muted-foreground" /> Show details</>)
              }
            </span>
            {expanded ? 
              <MessageSquare className="h-4 w-4 text-primary/70" /> : 
              <BookText className="h-4 w-4 text-primary/70" />
            }
          </Button>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 mt-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1 text-primary/70" />
                    Prompt:
                  </h4>
                  <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap border border-muted-foreground/10">
                    {prompt.prompt_text}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center">
                    <Star className="h-4 w-4 mr-1 text-amber-500" />
                    Why This Works:
                  </h4>
                  <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <AlertDescription className="text-sm text-muted-foreground">
                      {prompt.why_it_works}
                    </AlertDescription>
                  </Alert>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
