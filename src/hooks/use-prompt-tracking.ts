
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to track and limit prompt usage for free tier users
 */
export function usePromptTracking() {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [promptsRemaining, setPromptsRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [promptLimitReached, setPromptLimitReached] = useState(false);

  // Track prompt usage when a user views a prompt
  const trackPromptUsage = async () => {
    if (!isLoggedIn || !user) return;
    
    try {
      setIsLoading(true);
      
      // Call increment_prompt_usage RPC function to track usage
      const { data, error } = await supabase.rpc('increment_prompt_usage', {
        user_uuid: user.id
      });
      
      if (error) {
        console.error('Error tracking prompt usage:', error);
        return;
      }
      
      // Fetch the updated prompts remaining count
      await fetchPromptsRemaining();
    } catch (error) {
      console.error('Error in prompt tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the number of prompts remaining for the current month (for free tier)
  const fetchPromptsRemaining = async () => {
    if (!isLoggedIn || !user) {
      setPromptsRemaining(null);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get the current month and year
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-11
      const currentYear = now.getFullYear();
      
      // Get user's subscription tier
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const tier = subscriptionData?.tier || 'free';
      
      // If user is not on free tier, they have unlimited access
      if (tier !== 'free') {
        setPromptsRemaining(null); // null indicates unlimited
        setPromptLimitReached(false);
        return;
      }
      
      // Get the user's prompt usage for the current month
      const { data: usageData, error } = await supabase
        .from('user_prompt_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching prompt usage:', error);
        return;
      }
      
      const promptLimit = 50; // Default limit for free tier
      const usedPrompts = usageData?.count || 0;
      const remaining = promptLimit - usedPrompts;
      
      setPromptsRemaining(remaining > 0 ? remaining : 0);
      setPromptLimitReached(remaining <= 0);
      
      // Show a warning if the user is approaching the limit
      if (remaining <= 5 && remaining > 0) {
        toast({
          title: 'Prompt limit approaching',
          description: `You have ${remaining} prompt${remaining === 1 ? '' : 's'} remaining this month. Consider upgrading for unlimited access.`,
          variant: 'warning',
        });
      } else if (remaining <= 0) {
        toast({
          title: 'Prompt limit reached',
          description: 'You have reached your free tier prompt limit for this month. Upgrade to continue accessing more prompts.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching prompts remaining:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch prompts remaining when the component mounts
  useEffect(() => {
    fetchPromptsRemaining();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

  return {
    trackPromptUsage,
    fetchPromptsRemaining,
    promptsRemaining,
    isLoading,
    promptLimitReached
  };
}
