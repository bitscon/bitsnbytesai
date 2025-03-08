
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useSavedPrompts } from '@/hooks/use-saved-prompts';
import { Prompt } from '@/types/prompts';
import { cn } from '@/lib/utils';

interface SavePromptButtonProps {
  prompt: Prompt;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SavePromptButton({ 
  prompt, 
  variant = 'outline', 
  size = 'sm',
  className
}: SavePromptButtonProps) {
  const { user } = useAuth();
  const { isPromptSaved, savePrompt, unsavePrompt } = useSavedPrompts();
  
  const isSaved = isPromptSaved(prompt.id);

  const handleToggleSave = async () => {
    if (isSaved) {
      await unsavePrompt(prompt.id);
    } else {
      await savePrompt(prompt);
    }
  };

  if (!user) return null;

  return (
    <Button
      variant={isSaved ? 'secondary' : variant}
      size={size}
      onClick={handleToggleSave}
      className={cn("gap-1", className)}
      aria-label={isSaved ? "Unsave prompt" : "Save prompt"}
    >
      {isSaved ? (
        <>
          <BookmarkCheck className="h-4 w-4" />
          Saved
        </>
      ) : (
        <>
          <BookmarkPlus className="h-4 w-4" />
          Save
        </>
      )}
    </Button>
  );
}
