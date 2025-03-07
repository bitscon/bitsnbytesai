
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Prompt, PromptCategory, DifficultyLevel } from '@/types/prompts';
import { useToast } from '@/hooks/use-toast';

export function useAdminPrompts() {
  const { toast } = useToast();
  
  // Create a new category
  const createCategory = async (name: string): Promise<PromptCategory | null> => {
    try {
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
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Failed to create category',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };
  
  // Update a category
  const updateCategory = async (id: string, name: string): Promise<boolean> => {
    try {
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
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Failed to update category',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };
  
  // Delete a category
  const deleteCategory = async (id: string, name: string): Promise<boolean> => {
    try {
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
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Failed to delete category',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };
  
  // Create a new prompt
  const createPrompt = async (prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt | null> => {
    try {
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
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({
        title: 'Failed to create prompt',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };
  
  // Update a prompt
  const updatePrompt = async (id: string, promptData: Partial<Omit<Prompt, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
    try {
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
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast({
        title: 'Failed to update prompt',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };
  
  // Delete a prompt
  const deletePrompt = async (id: string): Promise<boolean> => {
    try {
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
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        title: 'Failed to delete prompt',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
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
