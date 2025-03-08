
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
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
  showTooltip?: boolean;
}

export function SavePromptButton({ 
  prompt, 
  variant = 'outline', 
  size = 'sm',
  className,
  showText = false, // Default to false to only show the icon
  showTooltip = true, // Default to true to maintain backward compatibility
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
      variant={isSaved ? 'ghost' : variant}
      size={size}
      onClick={handleToggleSave}
      className={cn(
        "aspect-square p-0", 
        isSaved ? "text-red-500 hover:text-red-600" : "", 
        className
      )}
      aria-label={isSaved ? "Remove favorite" : "Add to favorites"}
    >
      <Heart 
        className={cn("h-4 w-4", isSaved ? "fill-current" : "")} 
      />
      {showText && (isSaved ? 'Saved' : 'Save')}
    </Button>
  );

  // Only wrap in tooltip if showTooltip is true
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            {isSaved ? 'Remove favorite' : 'Favorite'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Just return the button without tooltip
  return button;
}
