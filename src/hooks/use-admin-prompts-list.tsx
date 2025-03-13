
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Prompt } from "@/types/prompts";
import { useToast } from "@/hooks/use-toast";

export function useAdminPromptsList() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Fetch prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching prompts with categories...");
        
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
          console.error('Supabase error fetching prompts:', error);
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} prompts`);
        setPrompts(data as Prompt[]);
      } catch (error: any) {
        console.error('Error fetching prompts:', error);
        setError(error as Error);
        toast({
          title: 'Failed to load prompts',
          description: error?.message || 'An unknown error occurred',
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
    console.log("Setting up real-time subscription for prompts");
    
    // Clean up any existing channels with the same name to avoid duplicates
    supabase.removeChannel(supabase.channel('schema-db-changes'));
    
    const promptsSubscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'prompts' 
        },
        (payload) => {
          console.log('Received change event for prompts:', payload);
          // Refetch prompts when there are changes
          const fetchPrompts = async () => {
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
                console.error('Error fetching prompts after change:', error);
                return;
              }
              
              console.log(`Updated prompts after change: ${data?.length || 0} prompts`);
              setPrompts(data as Prompt[]);
            } catch (err) {
              console.error('Error in subscription callback:', err);
            }
          };
          
          fetchPrompts();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status for prompts:', status);
      });

    return () => {
      console.log('Cleaning up subscription for prompts');
      supabase.removeChannel(promptsSubscription);
    };
  }, []);

  return {
    prompts,
    isLoading,
    error,
  };
}
