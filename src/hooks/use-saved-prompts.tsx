
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { SavedPrompt, Prompt } from '@/types/prompts';
import { useToast } from '@/hooks/use-toast';

export function useSavedPrompts() {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSavedPrompts = async () => {
    if (!user) {
      setSavedPrompts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
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

      setSavedPrompts(data as unknown as SavedPrompt[]);
    } catch (error) {
      console.error('Error fetching saved prompts:', error);
      toast({
        title: 'Error fetching saved prompts',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePrompt = async (prompt: Prompt) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save prompts',
        variant: 'destructive',
      });
      return null;
    }

    try {
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

      toast({
        title: 'Prompt saved',
        description: 'The prompt has been added to your favorites',
      });

      // Update local state
      setSavedPrompts([...savedPrompts, { ...data, prompt } as unknown as SavedPrompt]);
      return data;
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: 'Error saving prompt',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const unsavePrompt = async (promptId: string) => {
    if (!user) return false;

    try {
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

      toast({
        title: 'Prompt removed',
        description: 'The prompt has been removed from your favorites',
      });

      // Update local state
      setSavedPrompts(savedPrompts.filter(sp => sp.prompt_id !== promptId));
      return true;
    } catch (error) {
      console.error('Error removing saved prompt:', error);
      toast({
        title: 'Error removing prompt',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
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

    const subscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'saved_prompts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchSavedPrompts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  return {
    savedPrompts,
    isLoading,
    savePrompt,
    unsavePrompt,
    isPromptSaved,
    refreshSavedPrompts: fetchSavedPrompts,
  };
}
