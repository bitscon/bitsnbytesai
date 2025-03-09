
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useSubscription } from '@/hooks/use-subscription';

export function usePromptTracking() {
  const { user } = useAuth();
  const { subscription, currentUsage, fetchUserSubscription } = useSubscription();
  const [isTrackingPrompt, setIsTrackingPrompt] = useState(false);
  
  // Track prompt usage
  const trackPromptUsage = useCallback(async (promptId: string) => {
    if (!user || !subscription) return true;
    
    // If user is not on free tier, they have unlimited access
    if (subscription.tier !== 'free') {
      return true;
    }
    
    // Check if the user has reached the limit
    if (currentUsage && currentUsage.count >= currentUsage.limit) {
      return false;
    }
    
    setIsTrackingPrompt(true);
    try {
      // Increment usage in the database
      await supabase.rpc('increment_prompt_usage', { user_uuid: user.id });
      
      // Refresh user subscription to get updated usage
      await fetchUserSubscription();
      
      return true;
    } catch (error) {
      console.error('Error tracking prompt usage:', error);
      return true; // Allow access on error to prevent blocking users
    } finally {
      setIsTrackingPrompt(false);
    }
  }, [user, subscription, currentUsage, fetchUserSubscription]);
  
  // Calculate remaining prompts
  const getRemainingPrompts = useCallback(() => {
    if (!subscription || subscription.tier !== 'free' || !currentUsage) {
      return null;
    }
    
    return {
      used: currentUsage.count,
      total: currentUsage.limit,
      remaining: currentUsage.remaining
    };
  }, [subscription, currentUsage]);
  
  return {
    isTrackingPrompt,
    trackPromptUsage,
    getRemainingPrompts
  };
}
