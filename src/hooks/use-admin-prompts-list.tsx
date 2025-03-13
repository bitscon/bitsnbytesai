
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Prompt, PromptCategory } from "@/types/prompts";
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
        
        // Map data to Prompt type with proper prompt_categories handling
        const formattedPrompts = data?.map(prompt => {
          const { prompt_categories, ...restPrompt } = prompt;
          
          // Create a proper PromptCategory object with all required fields
          const formattedCategory: PromptCategory | undefined = prompt_categories 
            ? {
                id: prompt_categories.id,
                name: prompt_categories.name,
                created_at: new Date().toISOString() // Add the missing created_at field
              } 
            : undefined;
          
          return {
            ...restPrompt,
            prompt_categories: formattedCategory
          } as Prompt;
        }) || [];
        
        setPrompts(formattedPrompts);
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
    
    // Create a unique channel name to avoid conflicts
    const channelName = `admin-prompts-list-changes-${Date.now()}`;
    
    // Clean up any existing channels with the same name to avoid duplicates
    supabase.removeChannel(supabase.channel(channelName));
    
    const promptsSubscription = supabase
      .channel(channelName)
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
              
              // Map data to Prompt type with proper prompt_categories handling
              const formattedPrompts = data?.map(prompt => {
                const { prompt_categories, ...restPrompt } = prompt;
                
                // Create a proper PromptCategory object with all required fields
                const formattedCategory: PromptCategory | undefined = prompt_categories 
                  ? {
                      id: prompt_categories.id,
                      name: prompt_categories.name,
                      created_at: new Date().toISOString() // Add the missing created_at field
                    } 
                  : undefined;
                
                return {
                  ...restPrompt,
                  prompt_categories: formattedCategory
                } as Prompt;
              }) || [];
              
              setPrompts(formattedPrompts);
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
