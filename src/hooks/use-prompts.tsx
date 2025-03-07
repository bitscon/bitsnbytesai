
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
  const { toast } = useToast();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
        
        // Auto-select the first category if none is selected
        if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Failed to load categories',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    fetchCategories();
  }, [toast]);

  // Fetch prompts for selected category
  useEffect(() => {
    const fetchPrompts = async () => {
      if (!selectedCategory) {
        setPrompts([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
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
          throw error;
        }
        
        // Artificial delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        setPrompts(data as Prompt[]);
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
  }, [selectedCategory, selectedDifficulty, debouncedSearchTerm, toast]);

  // Set up real-time subscription for prompts
  useEffect(() => {
    const subscription = supabase
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
          if (selectedCategory) {
            const fetchPrompts = async () => {
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
                console.error('Error fetching prompts:', error);
                return;
              }
              
              setPrompts(data as Prompt[]);
            };
            
            fetchPrompts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedCategory, selectedDifficulty, debouncedSearchTerm]);

  // Set up real-time subscription for categories
  useEffect(() => {
    const subscription = supabase
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
    setSelectedCategory,
    setSelectedDifficulty,
    setSearchTerm,
  };
}
