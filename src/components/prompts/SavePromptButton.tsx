
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useSavedPrompts } from '@/hooks/use-saved-prompts';
import { Prompt } from '@/types/prompts';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SavePromptButtonProps {
  prompt: Prompt;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
}

export function SavePromptButton({ 
  prompt, 
  variant = 'outline', 
  size = 'sm',
  className,
  showText = true
}: SavePromptButtonProps) {
  const { user } = useAuth();
  const { isPromptSaved, savePrompt, unsavePrompt } = useSavedPrompts();
  
  const isSaved = isPromptSaved(prompt.id);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isSaved) {
      await unsavePrompt(prompt.id);
    } else {
      await savePrompt(prompt);
    }
  };

  if (!user) return null;

  const button = (
    <Button
      variant={isSaved ? 'secondary' : variant}
      size={size}
      onClick={handleToggleSave}
      className={cn(showText ? "gap-1" : "", className)}
      aria-label={isSaved ? "Unsave prompt" : "Save prompt"}
    >
      {isSaved ? (
        <>
          <BookmarkCheck className="h-4 w-4" />
          {showText && 'Saved'}
        </>
      ) : (
        <>
          <BookmarkPlus className="h-4 w-4" />
          {showText && 'Save'}
        </>
      )}
    </Button>
  );

  // If we're not showing text, wrap in tooltip for better UX
  if (!showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            {isSaved ? 'Remove from saved' : 'Save prompt'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
