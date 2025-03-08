
import React from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Prompt, PromptCategory } from '@/types/prompts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Star, MessageSquare, BrainCircuit, Sparkles, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SavePromptButton } from './SavePromptButton';
import { motion } from 'framer-motion';

interface PromptModalProps {
  prompt: Prompt | null;
  category?: PromptCategory;
  isOpen: boolean;
  onClose: () => void;
}

export function PromptModal({ prompt, category, isOpen, onClose }: PromptModalProps) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    if (!prompt) return;
    
    navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    
    toast({
      title: "Copied to clipboard",
      description: "The prompt has been copied to your clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const getDifficultyIcon = (level?: string) => {
    switch(level) {
      case 'Beginner': return <Sparkles className="h-4 w-4 mr-1" />;
      case 'Intermediate': return <Zap className="h-4 w-4 mr-1" />;
      case 'Advanced': return <BrainCircuit className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  const getDifficultyColor = (level?: string) => {
    switch(level) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!prompt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Combined difficulty, category, and save button in one row with justified spacing */}
          <div className="flex items-center justify-between mt-6 pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(
                "px-3 py-1 text-sm font-medium rounded-full flex items-center",
                getDifficultyColor(prompt.difficulty_level)
              )}>
                {getDifficultyIcon(prompt.difficulty_level)}
                {prompt.difficulty_level}
              </Badge>
              
              {category && (
                <span className="text-sm text-muted-foreground">
                  {category.name}
                </span>
              )}
            </div>
            
            <SavePromptButton 
              prompt={prompt} 
              size="sm" 
              className="h-8 ml-4" 
              showTooltip
            />
          </div>
          
          {/* Title */}
          <DialogTitle className="text-xl">
            {prompt.title}
          </DialogTitle>
          
          {/* Description */}
          {prompt.short_description && (
            <DialogDescription>
              {prompt.short_description}
            </DialogDescription>
          )}
          
          {/* Optional image */}
          {prompt.image_url && (
            <div className="my-4">
              <img 
                src={prompt.image_url}
                alt={`Illustration for ${prompt.title}`}
                className="rounded-md w-full h-48 object-cover"
              />
            </div>
          )}
          
          {/* Full prompt text */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-primary/70" />
              Full Prompt:
            </h4>
            <div className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap border border-muted-foreground/10 max-h-60 overflow-y-auto">
              {prompt.prompt_text}
            </div>
          </div>
          
          {/* Why it works */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center">
              <Star className="h-4 w-4 mr-2 text-amber-500" />
              Why This Works:
            </h4>
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-md text-sm text-muted-foreground max-h-40 overflow-y-auto">
              {prompt.why_it_works}
            </div>
          </div>
        </div>
        
        <DialogFooter className="px-6 py-4 border-t mt-auto shrink-0">
          <Button
            onClick={handleCopy}
            className="w-full md:w-auto"
            size="lg"
          >
            {copied ? 
              <Check className="h-4 w-4 mr-2" /> : 
              <Copy className="h-4 w-4 mr-2" />
            }
            {copied ? "Copied!" : "Copy Prompt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
