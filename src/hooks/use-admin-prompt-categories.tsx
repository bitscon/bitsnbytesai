
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PromptCategory } from "@/types/prompts";
import { useToast } from "@/hooks/use-toast";

export function useAdminPromptCategories() {
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('prompt_categories')
          .select('*')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        setCategories(data as PromptCategory[]);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Failed to load categories',
          description: error.message,
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
    const categoriesSubscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'prompt_categories' 
        },
        () => {
          // Refetch categories when there are changes
          const fetchCategories = async () => {
            const { data, error } = await supabase
              .from('prompt_categories')
              .select('*')
              .order('name');
            
            if (error) {
              console.error('Error fetching categories:', error);
              return;
            }
            
            setCategories(data as PromptCategory[]);
          };
          
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(categoriesSubscription);
    };
  }, []);

  return {
    categories,
    isLoading,
  };
}
