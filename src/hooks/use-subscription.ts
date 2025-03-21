
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
    updateCancelAtPeriodEnd,
    fetchError
  } = useSubscriptionState({
    userId: user?.id,
    userEmail: user?.email,
    isLoggedIn
  });
  
  // Initialize subscription actions
  const {
    subscribe,
    manageSubscription,
    changeSubscription,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess
  } = useSubscriptionActions({
    userEmail: user?.email,
    userId: user?.id,
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
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess,
    fetchError,
    
    // Actions and calculations
    fetchSubscriptionPlans: loadSubscriptionPlans,
    fetchUserSubscription: loadUserSubscription,
    loadUserSubscription,
    getCurrentPlan,
    isSubscriptionActive,
    hasAccess,
    subscribe,
    manageSubscription,
    changeSubscription,
    
    // Utility functions
    getTierName,
    formatDate
  };
}
