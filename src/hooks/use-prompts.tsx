
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Prompt, PromptCategory } from '@/types/prompts';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { subscribeToChanges, unsubscribeFromChanges } from '@/utils/supabase-realtime';

export function usePrompts() {
  const { 
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError
  } = useSupabaseQuery<PromptCategory>({
    table: 'prompt_categories',
    order: { column: 'name' },
    errorTitle: 'Failed to load prompt categories'
  });

  // Format prompts to ensure they match the Prompt type
  const formatPrompts = (data: any[]): Prompt[] => {
    return data.map(prompt => {
      // Handle null prompt_categories
      if (!prompt.prompt_categories) {
        return prompt as Prompt;
      }
      
      // Extract prompt_categories to handle it separately
      const { prompt_categories, ...restPrompt } = prompt;
      
      // Return properly formatted Prompt object
      return {
        ...restPrompt,
        prompt_categories: {
          ...prompt_categories
        }
      } as Prompt;
    });
  };

  const { 
    data: prompts,
    isLoading: promptsLoading,
    error: promptsError,
    refetch: refetchPrompts
  } = useSupabaseQuery<Prompt>({
    table: 'prompts',
    select: `
      *,
      prompt_categories (
        id,
        name,
        created_at
      )
    `,
    order: { column: 'created_at', ascending: false },
    errorTitle: 'Failed to load prompts',
    formatResult: formatPrompts
  });

  const isLoading = categoriesLoading || promptsLoading;
  const error = categoriesError || promptsError;

  return {
    categories,
    prompts,
    isLoading,
    error,
    refetchPrompts
  };
}
