
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Prompt } from "@/types/prompts";
import { useToast } from "@/hooks/use-toast";

export function useAdminPromptsList() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select(`
            *,
            prompt_categories (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setPrompts(data as any[]);
      } catch (error) {
        console.error('Error fetching prompts:', error);
        toast({
          title: 'Failed to load prompts',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [toast]);

  // Set up real-time subscription
  useEffect(() => {
    const promptsSubscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'prompts' 
        },
        () => {
          // Refetch prompts when there are changes
          const fetchPrompts = async () => {
            const { data, error } = await supabase
              .from('prompts')
              .select(`
                *,
                prompt_categories (
                  id,
                  name
                )
              `)
              .order('created_at', { ascending: false });
            
            if (error) {
              console.error('Error fetching prompts:', error);
              return;
            }
            
            setPrompts(data as any[]);
          };
          
          fetchPrompts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(promptsSubscription);
    };
  }, []);

  return {
    prompts,
    isLoading,
  };
}
