
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
        
        console.log(`Successfully fetched ${categoriesData?.length || 0} categories for library`);
        setCategories(categoriesData as PromptCategory[]);
        
        // Fetch all prompts at once
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (promptsError) {
          console.error('Supabase error fetching prompts:', promptsError);
          throw promptsError;
        }
        
        console.log(`Successfully fetched ${promptsData?.length || 0} prompts for library`);
        setPrompts(promptsData as Prompt[]);
        
      } catch (error: any) {
        console.error('Error fetching prompts and categories:', error);
        setError(error as Error);
        toast({
          title: 'Failed to load content',
          description: error?.message || 'Network error or database connection issue',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromptsAndCategories();
  }, [toast]);

  // Set up real-time subscription for prompts
  useEffect(() => {
    console.log("Setting up real-time subscription for prompts in library");
    
    // Clean up any existing channels with the same name to avoid duplicates
    supabase.removeChannel(supabase.channel('schema-db-changes'));
    
    const subscription = supabase
      .channel('schema-db-changes-prompts')
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
                .select('*')
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
    
    const subscription = supabase
      .channel('schema-db-changes-categories')
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
