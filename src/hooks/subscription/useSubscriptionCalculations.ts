
import { useCallback } from 'react';
import { SubscriptionPlan, UserSubscription, SubscriptionTier } from '@/types/subscription';
import { hasTierAccess } from '@/utils/subscription/subscriptionUtils';

interface UseSubscriptionCalculationsProps {
  userSubscription: UserSubscription | null;
  plans: SubscriptionPlan[];
}

export function useSubscriptionCalculations({ 
  userSubscription, 
  plans 
}: UseSubscriptionCalculationsProps) {
  
  /**
   * Gets the current subscription plan object
   */
  const getCurrentPlan = useCallback((): SubscriptionPlan | undefined => {
    if (!userSubscription || !plans.length) return undefined;
    return plans.find(plan => plan.tier === userSubscription.tier);
  }, [userSubscription, plans]);

  /**
   * Checks if the subscription is active
   */
  const isSubscriptionActive = useCallback((): boolean => {
    if (!userSubscription) return false;
    
    // Free tier is always active
    if (userSubscription.tier === 'free') return true;
    
    // For paid tiers, check if there's a valid subscription
    if (!userSubscription.current_period_end) return false;
    
    // Check if subscription has expired
    const currentPeriodEnd = new Date(userSubscription.current_period_end);
    const now = new Date();
    
    return currentPeriodEnd > now;
  }, [userSubscription]);

  /**
   * Checks if the user has access to a specific tier
   */
  const hasAccess = useCallback((requiredTier: SubscriptionTier): boolean => {
    if (!userSubscription) return false;
    return hasTierAccess(userSubscription.tier, requiredTier);
  }, [userSubscription]);

  return {
    getCurrentPlan,
    isSubscriptionActive,
    hasAccess
  };
}
