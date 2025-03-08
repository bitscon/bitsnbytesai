
import React from 'react';
import { SavedPromptsList } from '@/components/prompts/SavedPromptsList';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Navigate } from 'react-router-dom';
import { useSavedPrompts } from '@/hooks/use-saved-prompts';
import { usePrompts } from '@/hooks/use-prompts';

export default function SavedPrompts() {
  const { user, isLoading: authLoading } = useAuth();
  const { savedPrompts, isLoading: savedPromptsLoading } = useSavedPrompts();
  const { categories } = usePrompts();
  
  const isLoading = authLoading || savedPromptsLoading;
  
  if (authLoading) {
    return (
      <div className="container py-12">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Extract the prompt objects from the savedPrompts array
  const prompts = savedPrompts.map(savedPrompt => savedPrompt.prompt).filter(Boolean);

  return (
    <div className="container py-12">
      <div className="flex items-center mb-8">
        <Bookmark className="mr-3 h-6 w-6" />
        <h1 className="text-3xl font-bold">Favorites</h1>
      </div>
      
      <div className="mb-8">
        <p className="text-muted-foreground">
          Here are the prompts you've saved for quick reference. You can remove items from your favorites by clicking the heart icon.
        </p>
      </div>
      
      <SavedPromptsList 
        savedPrompts={prompts}
        categories={categories}
        isLoading={isLoading}
      />
    </div>
  );
}
