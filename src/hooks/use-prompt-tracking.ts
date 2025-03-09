
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { PromptUsage } from '@/types/subscription';

export function usePromptTracking() {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasRemainingPrompts, setHasRemainingPrompts] = useState<boolean>(true);
  const [promptUsage, setPromptUsage] = useState<PromptUsage>({
    count: 0,
    month: 0,
    year: 0
  });
  const [promptLimit, setPromptLimit] = useState<number>(50);
  
  const fetchPromptUsage = async () => {
    if (!isLoggedIn || !user) return;
    
    try {
      setIsLoading(true);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JS months are 0-based
      const currentYear = currentDate.getFullYear();
      
      // Check if user has remaining prompts in their quota
      const { data: hasRemaining, error: checkError } = await supabase.rpc('has_remaining_prompts');
      
      if (checkError) {
        console.error('Error checking remaining prompts:', checkError);
        return;
      }
      
      setHasRemainingPrompts(hasRemaining);
      
      // Get the current month's usage
      const { data: usageData, error: usageError } = await supabase
        .from('user_prompt_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();
      
      if (usageError) {
        console.error('Error fetching prompt usage:', usageError);
        return;
      }
      
      setPromptUsage({
        count: usageData?.count || 0,
        month: currentMonth,
        year: currentYear
      });
      
    } catch (error) {
      console.error('Error in fetchPromptUsage:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const trackPromptUse = async () => {
    if (!isLoggedIn || !user) return;
    
    try {
      // Increment the prompt usage for the current user
      const { error } = await supabase.rpc('increment_prompt_usage');
      
      if (error) {
        console.error('Error incrementing prompt usage:', error);
        return;
      }
      
      // Update local state
      setPromptUsage(prev => ({
        ...prev,
        count: prev.count + 1
      }));
      
      // Check if this was the last prompt in their quota
      if (promptUsage.count + 1 >= promptLimit) {
        setHasRemainingPrompts(false);
        toast({
          title: "Prompt limit reached",
          description: "You've reached your free tier prompt limit for this month. Upgrade to continue accessing premium features.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error in trackPromptUse:', error);
    }
  };
  
  // Fetch prompt usage when component mounts or user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchPromptUsage();
    }
  }, [isLoggedIn, user]);
  
  return {
    isLoading,
    promptUsage,
    hasRemainingPrompts,
    promptLimit,
    trackPromptUse,
    fetchPromptUsage
  };
}
