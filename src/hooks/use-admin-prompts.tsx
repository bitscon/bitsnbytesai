
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Prompt, PromptCategory, DifficultyLevel } from '@/types/prompts';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { useToast } from '@/hooks/use-toast';

export function useAdminPrompts() {
  const { toast } = useToast();
  const { withErrorHandling } = useErrorHandling({
    errorTitle: 'Admin Prompts Error',
  });
  
  // Create a new category
  const createCategory = async (name: string): Promise<PromptCategory | null> => {
    return await withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('prompt_categories')
        .insert([{ name }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Category created',
        description: `Successfully created "${name}" category`,
      });
      
      return data as PromptCategory;
    }, true, 'Failed to create category');
  };
  
  // Update a category
  const updateCategory = async (id: string, name: string): Promise<boolean> => {
    return await withErrorHandling(async () => {
      const { error } = await supabase
        .from('prompt_categories')
        .update({ name })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Category updated',
        description: `Successfully updated to "${name}"`,
      });
      
      return true;
    }, true, 'Failed to update category');
  };
  
  // Delete a category
  const deleteCategory = async (id: string, name: string): Promise<boolean> => {
    return await withErrorHandling(async () => {
      const { error } = await supabase
        .from('prompt_categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Category deleted',
        description: `Successfully deleted "${name}" category`,
      });
      
      return true;
    }, true, 'Failed to delete category');
  };
  
  // Create a new prompt
  const createPrompt = async (prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt | null> => {
    return await withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('prompts')
        .insert([prompt])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Prompt created',
        description: 'Successfully created new prompt',
      });
      
      return data as Prompt;
    }, true, 'Failed to create prompt');
  };
  
  // Update a prompt
  const updatePrompt = async (id: string, promptData: Partial<Omit<Prompt, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
    return await withErrorHandling(async () => {
      const { error } = await supabase
        .from('prompts')
        .update(promptData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Prompt updated',
        description: 'Successfully updated prompt',
      });
      
      return true;
    }, true, 'Failed to update prompt');
  };
  
  // Delete a prompt
  const deletePrompt = async (id: string): Promise<boolean> => {
    return await withErrorHandling(async () => {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Prompt deleted',
        description: 'Successfully deleted prompt',
      });
      
      return true;
    }, true, 'Failed to delete prompt');
  };
  
  return {
    createCategory,
    updateCategory,
    deleteCategory,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
