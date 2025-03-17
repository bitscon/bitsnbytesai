
import { useState, useEffect } from "react";
import { PromptCategory } from "@/types/prompts";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";

export function useAdminPromptCategories() {
  const { 
    data: categories,
    isLoading,
    error,
    refetch
  } = useSupabaseQuery<PromptCategory>({
    table: 'prompt_categories',
    order: { column: 'name' },
    errorTitle: 'Failed to load prompt categories'
  });

  return {
    categories,
    isLoading,
    error,
    refetchCategories: refetch
  };
}
