
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PromptCategory } from "@/types/prompts";
import { useToast } from "@/hooks/use-toast";

export function useAdminPromptCategories() {
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("Fetching prompt categories...");
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('prompt_categories')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Supabase error fetching categories:', error);
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} categories`);
        setCategories(data as PromptCategory[]);
      } catch (error: any) {
        console.error('Error fetching categories:', error);
        setError(error as Error);
        toast({
          title: 'Failed to load categories',
          description: error?.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [toast]);

  // Set up real-time subscription
  useEffect(() => {
    console.log("Setting up real-time subscription for prompt_categories");
    
    // Use a unique channel name to avoid conflicts
    const channelName = 'admin-categories-channel';
    
    // Clean up any existing channels with the same name to avoid duplicates
    supabase.removeChannel(supabase.channel(channelName));
    
    const categoriesSubscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'prompt_categories' 
        },
        (payload) => {
          console.log('Received change event for prompt_categories:', payload);
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
        console.log('Subscription status for prompt_categories:', status);
      });

    return () => {
      console.log('Cleaning up subscription for prompt_categories');
      supabase.removeChannel(categoriesSubscription);
    };
  }, []);

  return {
    categories,
    isLoading,
    error,
  };
}
