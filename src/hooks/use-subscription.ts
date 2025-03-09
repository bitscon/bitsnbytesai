
import { useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { SubscriptionTier } from '@/types/subscription';
import { getTierName, formatDate } from '@/utils/subscription/subscriptionUtils';
import { useSubscriptionState } from './subscription/useSubscriptionState';
import { useSubscriptionActions } from './subscription/useSubscriptionActions';
import { useSubscriptionCalculations } from './subscription/useSubscriptionCalculations';

export function useSubscription() {
  const { user, isLoggedIn } = useAuth();
  
  // Initialize subscription state
  const {
    isLoading,
    plans,
    stripePublicKey,
    userSubscription,
    stripeSubscription,
    cancelAtPeriodEnd,
    isSubscriptionLoading,
    subscriptionStripeCustomerId,
    currentUsage,
    isSubscribing,
    isManagingSubscription,
    loadSubscriptionPlans,
    loadUserSubscription,
    setSubscribingStatus,
    setManagingStatus,
    updateCancelAtPeriodEnd
  } = useSubscriptionState({
    userId: user?.id,
    userEmail: user?.email,
    isLoggedIn
  });
  
  // Initialize subscription actions
  const {
    subscribe,
    manageSubscription
  } = useSubscriptionActions({
    userEmail: user?.email,
    subscriptionStripeCustomerId,
    stripeCustomerId: userSubscription?.stripe_customer_id,
    stripeSubscriptionId: userSubscription?.stripe_subscription_id,
    loadUserSubscription,
    setSubscribingStatus,
    setManagingStatus,
    updateCancelAtPeriodEnd
  });
  
  // Initialize subscription calculations
  const {
    getCurrentPlan,
    isSubscriptionActive,
    hasAccess
  } = useSubscriptionCalculations({
    userSubscription,
    plans
  });

  // Fetch subscription plans when component mounts
  useEffect(() => {
    loadSubscriptionPlans();
  }, [loadSubscriptionPlans]);

  // Fetch user subscription when user logs in or changes
  useEffect(() => {
    loadUserSubscription();
  }, [loadUserSubscription]);

  // Return the public API for the hook
  return {
    // State
    isLoading,
    plans,
    stripePublicKey,
    userSubscription,
    subscription: userSubscription, // Alias for backward compatibility
    stripeSubscription,
    cancelAtPeriodEnd,
    currentUsage,
    isSubscribing,
    isManagingSubscription,
    isSubscriptionLoading,
    
    // Actions and calculations
    fetchSubscriptionPlans: loadSubscriptionPlans,
    fetchUserSubscription: loadUserSubscription,
    getCurrentPlan,
    isSubscriptionActive,
    hasAccess,
    subscribe,
    manageSubscription,
    
    // Utility functions
    getTierName,
    formatDate
  };
}
