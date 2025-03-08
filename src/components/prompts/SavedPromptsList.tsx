
import React from 'react';
import { useSavedPrompts } from '@/hooks/use-saved-prompts';
import { PromptCard } from './PromptCard';
import { Card } from '@/components/ui/card';
import { Loader2, Bookmark } from 'lucide-react';

export function SavedPromptsList() {
  const { savedPrompts, isLoading } = useSavedPrompts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading saved prompts...</span>
      </div>
    );
  }

  if (savedPrompts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <Bookmark className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-medium">No saved prompts</h3>
          <p className="text-muted-foreground">
            You haven't saved any prompts yet. Browse the prompt library and click "Save" on prompts you want to reference later.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedPrompts.map((savedPrompt) => (
        <PromptCard 
          key={savedPrompt.id} 
          prompt={savedPrompt.prompt!} 
        />
      ))}
    </div>
  );
}
