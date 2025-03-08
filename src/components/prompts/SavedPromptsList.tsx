
import React from 'react';
import { Prompt, PromptCategory } from '@/types/prompts';
import { Card, CardContent } from '@/components/ui/card';
import { PromptCard } from './PromptCard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SavedPromptsListProps {
  savedPrompts: Prompt[];
  categories: PromptCategory[];
  isLoading: boolean;
}

export function SavedPromptsList({ savedPrompts, categories, isLoading }: SavedPromptsListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex justify-center items-center min-h-[200px]">
            <p className="text-muted-foreground">Loading saved prompts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (savedPrompts.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center min-h-[300px] space-y-4">
            <p className="text-muted-foreground">You haven't saved any prompts yet.</p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse prompts
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedPrompts.map((prompt) => {
        const category = categories.find((c) => c.id === prompt.category_id);
        
        return (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            category={category}
            onClick={() => {}} // Adding the required onClick prop
          />
        );
      })}
    </div>
  );
}
