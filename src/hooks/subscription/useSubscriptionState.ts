
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPlan, UserSubscription, PromptUsage } from '@/types/subscription';
import { fetchSubscriptionPlans, fetchStripeSubscription } from '@/api/subscriptionAPI';

interface StripeSubscription {
  id: string;
  customer: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  plan: {
    id: string;
    interval: 'month' | 'year';
  };
}

interface CurrentUsage {
  count: number;
  limit: number;
  remaining: number;
}

interface UseSubscriptionStateProps {
  userId?: string;
  userEmail?: string;
  isLoggedIn: boolean;
}

export function useSubscriptionState({ userId, userEmail, isLoggedIn }: UseSubscriptionStateProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stripePublicKey, setStripePublicKey] = useState<string>('');
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [stripeSubscription, setStripeSubscription] = useState<StripeSubscription | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState<boolean>(true);
  const [subscriptionStripeCustomerId, setSubscriptionStripeCustomerId] = useState<string | null>(null);
  const [currentUsage, setCurrentUsage] = useState<CurrentUsage | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState<boolean>(false);

  const loadSubscriptionPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { plans, stripePublicKey, error } = await fetchSubscriptionPlans();
      
      if (error) {
        console.error('Error loading subscription plans:', error);
        return;
      }
      
      setPlans(plans);
      if (stripePublicKey) {
        setStripePublicKey(stripePublicKey);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserSubscription = useCallback(async () => {
    if (!isLoggedIn || !userId) {
      setUserSubscription(null);
      setIsSubscriptionLoading(false);
      return;
    }
    
    try {
      setIsSubscriptionLoading(true);
      
      // Get user's subscription from our database
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (subscriptionError) {
        console.error('Error fetching user subscription:', subscriptionError);
        return;
      }
      
      if (subscriptionData) {
        setUserSubscription(subscriptionData);
        setSubscriptionStripeCustomerId(subscriptionData.stripe_customer_id || null);
        
        // If subscription is not free tier, fetch Stripe details
        if (subscriptionData.tier !== 'free' && subscriptionData.stripe_subscription_id) {
          const { subscription, error: stripeError } = await fetchStripeSubscription(
            subscriptionData.stripe_subscription_id
          );
          
          if (stripeError) {
            console.error('Error fetching Stripe subscription details:', stripeError);
          } else if (subscription) {
            setStripeSubscription(subscription);
            setCancelAtPeriodEnd(subscription.cancel_at_period_end);
          }
        }
        
        // Fetch current usage if on free tier
        if (subscriptionData.tier === 'free') {
          await loadFreeUsage(userId);
        }
      } else {
        // If no subscription record exists, create one with free tier
        await createFreeSubscription(userId);
      }
    } catch (error) {
      console.error('Error in loadUserSubscription:', error);
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, [isLoggedIn, userId]);

  const loadFreeUsage = async (userId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const { data: usageData, error: usageError } = await supabase
      .from('user_prompt_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .maybeSingle();
    
    if (!usageError) {
      const limit = 50; // Default free tier limit
      const count = usageData?.count || 0;
      setCurrentUsage({
        count,
        limit,
        remaining: Math.max(0, limit - count)
      });
    }
  };

  const createFreeSubscription = async (userId: string) => {
    const { error: createError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        tier: 'free'
      });
    
    if (createError) {
      console.error('Error creating user subscription record:', createError);
    } else {
      // Fetch the newly created subscription
      const { data: newSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (newSubscription) {
        setUserSubscription(newSubscription);
      }
    }
  };

  // Set status flags
  const setSubscribingStatus = (status: boolean) => setIsSubscribing(status);
  const setManagingStatus = (status: boolean) => setIsManagingSubscription(status);
  const updateCancelAtPeriodEnd = (status: boolean) => setCancelAtPeriodEnd(status);

  // Return all state and state setters
  return {
    // State
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
    
    // Actions
    loadSubscriptionPlans,
    loadUserSubscription,
    setSubscribingStatus,
    setManagingStatus,
    updateCancelAtPeriodEnd,
    
    // Setters for testing/mocking
    setUserSubscription,
    setStripeSubscription
  };
}
