
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PromptUsage } from '@/types/subscription';

export function usePromptTracking() {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasRemainingPrompts, setHasRemainingPrompts] = useState<boolean>(true);
  const [usage, setUsage] = useState<PromptUsage | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(50); // Default free tier limit

  // Fetch the user's prompt usage for the current month
  const fetchPromptUsage = useCallback(async () => {
    if (!isLoggedIn || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = now.getFullYear();

      // Check if user has remaining prompts (using Supabase RPC call)
      const { data: hasRemaining, error: remainingError } = await supabase
        .rpc('has_remaining_prompts', { user_uuid: user.id });

      if (remainingError) {
        console.error('Error checking remaining prompts:', remainingError);
        toast({
          title: 'Error',
          description: 'Failed to check prompt usage limits. Please try again later.',
          variant: 'destructive',
        });
        return;
      }

      setHasRemainingPrompts(!!hasRemaining);

      // Get actual usage count
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

      const count = usageData?.count || 0;
      const remaining = Math.max(0, monthlyLimit - count);

      setUsage({
        count,
        limit: monthlyLimit,
        remaining,
        month: currentMonth,
        year: currentYear
      });
    } catch (error) {
      console.error('Error in fetchPromptUsage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, user, toast, monthlyLimit]);

  // Track prompt usage (increment the counter)
  const trackPromptUsage = useCallback(async () => {
    if (!isLoggedIn || !user) return;

    try {
      // First check if user has remaining prompts
      const { data: hasRemaining, error: remainingError } = await supabase
        .rpc('has_remaining_prompts', { user_uuid: user.id });

      if (remainingError) {
        console.error('Error checking remaining prompts:', remainingError);
        return false;
      }

      if (!hasRemaining) {
        toast({
          title: 'Usage Limit Reached',
          description: 'You have reached your monthly limit of free prompts. Upgrade your subscription to get unlimited access.',
          variant: 'default', // Changed from 'warning' to 'default'
        });
        return false;
      }

      // Increment the usage counter
      const { error: incrementError } = await supabase
        .rpc('increment_prompt_usage', { user_uuid: user.id });

      if (incrementError) {
        console.error('Error incrementing prompt usage:', incrementError);
        return false;
      }

      // Refresh the usage data
      fetchPromptUsage();
      return true;
    } catch (error) {
      console.error('Error in trackPromptUsage:', error);
      return false;
    }
  }, [isLoggedIn, user, toast, fetchPromptUsage]);

  // Fetch usage on component mount or when user changes
  useEffect(() => {
    fetchPromptUsage();
  }, [fetchPromptUsage]);

  return {
    isLoading,
    hasRemainingPrompts,
    usage,
    trackPromptUsage,
    fetchPromptUsage
  };
}
