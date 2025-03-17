
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { SavedPrompt, Prompt } from '@/types/prompts';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { subscribeToChanges, unsubscribeFromChanges } from '@/utils/supabase-realtime';

export function useSavedPrompts() {
  const { user } = useAuth();
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const { error, isLoading, setIsLoading, handleError, withErrorHandling } = useErrorHandling({
    errorTitle: 'Error with saved prompts',
  });

  // Format saved prompts to ensure they match the SavedPrompt type
  const formatSavedPrompts = (data: any[]): SavedPrompt[] => {
    return data as SavedPrompt[];
  };

  const fetchSavedPrompts = async () => {
    if (!user) {
      setSavedPrompts([]);
      return [];
    }

    return await withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('saved_prompts')
        .select(`
          *,
          prompt:prompts(*)
        `)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const formattedData = formatSavedPrompts(data);
      setSavedPrompts(formattedData);
      return formattedData;
    }, true, 'Error fetching saved prompts');
  };

  const savePrompt = async (prompt: Prompt) => {
    if (!user) {
      handleError(new Error('Authentication required'), 'Authentication required', 'Please sign in to save prompts');
      return null;
    }

    return await withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('saved_prompts')
        .insert({
          user_id: user.id,
          prompt_id: prompt.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      const newSavedPrompt = { ...data, prompt } as SavedPrompt;
      setSavedPrompts([...savedPrompts, newSavedPrompt]);
      
      return data;
    }, true, 'Prompt saved', 'The prompt has been added to your favorites');
  };

  const unsavePrompt = async (promptId: string) => {
    if (!user) return false;

    return await withErrorHandling(async () => {
      const savedPrompt = savedPrompts.find(sp => sp.prompt_id === promptId);
      
      if (!savedPrompt) {
        throw new Error('Saved prompt not found');
      }

      const { error } = await supabase
        .from('saved_prompts')
        .delete()
        .eq('id', savedPrompt.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setSavedPrompts(savedPrompts.filter(sp => sp.prompt_id !== promptId));
      return true;
    }, true, 'Prompt removed', 'The prompt has been removed from your favorites');
  };

  const isPromptSaved = (promptId: string) => {
    return savedPrompts.some(sp => sp.prompt_id === promptId);
  };

  // Fetch saved prompts on initial load and when user changes
  useEffect(() => {
    fetchSavedPrompts();
  }, [user]);

  // Set up real-time subscription for saved_prompts
  useEffect(() => {
    if (!user) return;

    const subscription = subscribeToChanges(
      { 
        table: 'saved_prompts',
        filter: `user_id=eq.${user.id}`
      },
      () => {
        fetchSavedPrompts();
      }
    );

    return () => {
      if (subscription) {
        unsubscribeFromChanges(subscription);
      }
    };
  }, [user]);

  return {
    savedPrompts,
    isLoading,
    error,
    savePrompt,
    unsavePrompt,
    isPromptSaved,
    refreshSavedPrompts: fetchSavedPrompts,
  };
}
