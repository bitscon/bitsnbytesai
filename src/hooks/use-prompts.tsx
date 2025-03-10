
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Prompt, PromptCategory, DifficultyLevel } from '@/types/prompts';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

export function usePrompts() {
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("Fetching prompt categories for library...");
        setError(null);
        
        const { data, error } = await supabase
          .from('prompt_categories')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Supabase error fetching categories:', error);
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} categories for library`);
        setCategories(data as PromptCategory[]);
        
        // Auto-select the first category if none is selected
        if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError(error as Error);
        toast({
          title: 'Failed to load categories',
          description: error.message || 'Network error or database connection issue',
          variant: 'destructive',
        });
      }
    };

    fetchCategories();
  }, [toast]);

  // Fetch prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      if (!selectedCategory) {
        setPrompts([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching prompts for category ${selectedCategory}...`);
        
        let query = supabase
          .from('prompts')
          .select('*');
          
        // Apply category filter
        query = query.eq('category_id', selectedCategory);
          
        // Apply difficulty filter if selected
        if (selectedDifficulty) {
          query = query.eq('difficulty_level', selectedDifficulty);
        }
        
        // Apply search filter if present
        if (debouncedSearchTerm) {
          query = query.or(`prompt_text.ilike.%${debouncedSearchTerm}%,why_it_works.ilike.%${debouncedSearchTerm}%`);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase error fetching prompts:', error);
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} prompts for category ${selectedCategory}`);
        
        // Artificial delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        setPrompts(data as Prompt[]);
      } catch (error) {
        console.error('Error fetching prompts:', error);
        setError(error as Error);
        toast({
          title: 'Failed to load prompts',
          description: error.message || 'Network error or database connection issue',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [selectedCategory, selectedDifficulty, debouncedSearchTerm, toast]);

  // Set up real-time subscription for prompts
  useEffect(() => {
    console.log("Setting up real-time subscription for prompts in library");
    const subscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'prompts' 
        },
        (payload) => {
          console.log('Received change event for prompts in library:', payload);
          // Refetch prompts when there are changes
          if (selectedCategory) {
            const fetchPrompts = async () => {
              try {
                let query = supabase
                  .from('prompts')
                  .select('*')
                  .eq('category_id', selectedCategory);
                  
                if (selectedDifficulty) {
                  query = query.eq('difficulty_level', selectedDifficulty);
                }
                
                if (debouncedSearchTerm) {
                  query = query.or(`prompt_text.ilike.%${debouncedSearchTerm}%,why_it_works.ilike.%${debouncedSearchTerm}%`);
                }
                
                const { data, error } = await query.order('created_at', { ascending: false });
                
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
        }
      )
      .subscribe((status) => {
        console.log('Subscription status for prompts in library:', status);
      });

    return () => {
      console.log('Cleaning up subscription for prompts in library');
      supabase.removeChannel(subscription);
    };
  }, [selectedCategory, selectedDifficulty, debouncedSearchTerm]);

  // Set up real-time subscription for categories
  useEffect(() => {
    console.log("Setting up real-time subscription for categories in library");
    const subscription = supabase
      .channel('schema-db-changes')
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
    selectedCategory,
    selectedDifficulty,
    searchTerm,
    isLoading,
    error,
    setSelectedCategory,
    setSelectedDifficulty,
    setSearchTerm,
  };
}
