
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Prompt, PromptCategory } from "@/types/prompts";
import { useErrorHandling } from "@/hooks/use-error-handling";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";

export function useAdminPromptsList() {
  // Format prompts to ensure they match the Prompt type with proper prompt_categories handling
  const formatPrompts = (data: any[]): Prompt[] => {
    return data.map(prompt => {
      // Handle null prompt_categories
      if (!prompt.prompt_categories) {
        return prompt as Prompt;
      }
      
      // Extract prompt_categories to handle it separately
      const { prompt_categories, ...restPrompt } = prompt;
      
      // Create a proper PromptCategory object with all required fields
      const formattedCategory: PromptCategory = {
        id: prompt_categories.id,
        name: prompt_categories.name,
        created_at: prompt_categories.created_at || new Date().toISOString() // Add the missing created_at field if needed
      };
      
      return {
        ...restPrompt,
        prompt_categories: formattedCategory
      } as Prompt;
    });
  };

  const { 
    data: prompts,
    isLoading,
    error,
    refetch
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
    errorTitle: 'Failed to load admin prompts',
    formatResult: formatPrompts
  });

  return {
    prompts,
    isLoading,
    error,
    refetchPrompts: refetch
  };
}
