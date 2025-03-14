
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Prompt, PromptCategory } from '@/types/prompts';
import { useToast } from '@/hooks/use-toast';

export function usePrompts() {
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Fetch all prompts and categories at once
  useEffect(() => {
    let isMounted = true;
    const fetchPromptsAndCategories = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching prompt categories and all prompts for library...");
        setError(null);
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('prompt_categories')
          .select('*')
          .order('name');
        
        if (categoriesError) {
          console.error('Supabase error fetching categories:', categoriesError);
          throw categoriesError;
        }
        
        if (!isMounted) return;
        
        console.log(`Successfully fetched ${categoriesData?.length || 0} categories for library`);
        setCategories(categoriesData as PromptCategory[]);
        
        // Fetch all prompts at once
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select(`
            *,
            prompt_categories (
              id,
              name,
              created_at
            )
          `)
          .order('created_at', { ascending: false });
        
        if (promptsError) {
          console.error('Supabase error fetching prompts:', promptsError);
          throw promptsError;
        }
        
        if (!isMounted) return;
        
        console.log(`Successfully fetched ${promptsData?.length || 0} prompts for library`);
        
        // Format the prompts to match the Prompt type
        const formattedPrompts = promptsData?.map(prompt => {
          // Handle null prompt_categories
          if (!prompt.prompt_categories) {
            return prompt as unknown as Prompt;
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
        }) || [];
        
        setPrompts(formattedPrompts);
        
      } catch (error: any) {
        console.error('Error fetching prompts and categories:', error);
        if (isMounted) {
          setError(error as Error);
          toast({
            title: 'Failed to load content',
            description: error?.message || 'Network error or database connection issue',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPromptsAndCategories();
    
    // Add a safety timeout to ensure loading state doesn't get stuck
    const timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        setIsLoading(false);
        console.warn('Fetch operation timed out - forcing loading state to complete');
        toast({
          title: 'Loading timed out',
          description: 'Please refresh the page if content is missing',
          variant: 'destructive',
        });
      }
    }, 10000); // 10 second timeout

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [toast]);

  // Set up real-time subscription for prompts
  useEffect(() => {
    console.log("Setting up real-time subscription for prompts in library");
    
    // Create a unique channel name to avoid conflicts
    const channelName = 'prompts-library-changes';
    
    // Clean up any existing channels with the same name to avoid duplicates
    supabase.removeChannel(supabase.channel(channelName));
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'prompts' 
        },
        (payload) => {
          console.log('Received change event for prompts in library:', payload);
          // Refetch all prompts when there are changes
          const fetchPrompts = async () => {
            try {
              const { data, error } = await supabase
                .from('prompts')
                .select(`
                  *,
                  prompt_categories (
                    id,
                    name,
                    created_at
                  )
                `)
                .order('created_at', { ascending: false });
              
              if (error) {
                console.error('Error fetching prompts after change:', error);
                return;
              }
              
              console.log(`Updated prompts after change: ${data?.length || 0} prompts`);
              
              // Format the prompts to match the Prompt type
              const formattedPrompts = data?.map(prompt => {
                // Handle null prompt_categories
                if (!prompt.prompt_categories) {
                  return prompt as unknown as Prompt;
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
        console.log('Subscription status for prompts in library:', status);
      });

    return () => {
      console.log('Cleaning up subscription for prompts in library');
      supabase.removeChannel(subscription);
    };
  }, []);

  // Set up real-time subscription for categories
  useEffect(() => {
    console.log("Setting up real-time subscription for categories in library");
    
    // Create a unique channel name to avoid conflicts
    const channelName = 'categories-library-changes';
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'prompt_categories' 
        },
        (payload) => {
          console.log('Received change event for categories in library:', payload);
          // Refetch categories when there are changes
          const fetchCategories = async () => {
            try {
              const { data, error } = await supabase
                .from('prompt_categories')
                .select('*')
                .order('name');
              
              if (error) {
                console.error('Error fetching categories after change:', error);
                return;
              }
              
              console.log(`Updated categories after change: ${data?.length || 0} categories`);
              setCategories(data as PromptCategory[]);
            } catch (err) {
              console.error('Error in subscription callback:', err);
            }
          };
          
          fetchCategories();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status for categories in library:', status);
      });

    return () => {
      console.log('Cleaning up subscription for categories in library');
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    categories,
    prompts,
    isLoading,
    error,
  };
}
