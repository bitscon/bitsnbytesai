
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan, UserSubscription, SubscriptionTier } from '@/types/subscription';

export function useSubscription() {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stripePublicKey, setStripePublicKey] = useState<string>('');
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState<boolean>(true);
  const [subscriptionStripeCustomerId, setSubscriptionStripeCustomerId] = useState<string | null>(null);

  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-subscription-plans');
      
      if (error) {
        console.error('Error fetching subscription plans:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscription plans. Please try again later.',
          variant: 'destructive',
        });
        return;
      }
      
      if (data.plans) {
        setPlans(data.plans);
      }
      
      if (data.stripePublicKey) {
        setStripePublicKey(data.stripePublicKey);
      }
    } catch (error) {
      console.error('Error in fetchSubscriptionPlans:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchUserSubscription = useCallback(async () => {
    if (!isLoggedIn || !user) {
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
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (subscriptionError) {
        console.error('Error fetching user subscription:', subscriptionError);
        return;
      }
      
      if (subscriptionData) {
        setUserSubscription(subscriptionData);
        setSubscriptionStripeCustomerId(subscriptionData.stripe_customer_id || null);
      } else {
        // If no subscription record exists, create one with free tier
        const { error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            tier: 'free'
          });
        
        if (createError) {
          console.error('Error creating user subscription record:', createError);
        } else {
          // Fetch the newly created subscription
          const { data: newSubscription } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (newSubscription) {
            setUserSubscription(newSubscription);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserSubscription:', error);
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, [isLoggedIn, user]);

  const getCurrentPlan = useCallback((): SubscriptionPlan | undefined => {
    if (!userSubscription || !plans.length) return undefined;
    
    return plans.find(plan => plan.tier === userSubscription.tier);
  }, [userSubscription, plans]);

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

  const hasAccess = useCallback((requiredTier: SubscriptionTier): boolean => {
    if (!userSubscription) return false;
    
    const tierLevels: Record<SubscriptionTier, number> = {
      free: 0,
      pro: 1,
      premium: 2,
      enterprise: 3
    };
    
    // Check if user's tier level is greater than or equal to required tier level
    return tierLevels[userSubscription.tier] >= tierLevels[requiredTier];
  }, [userSubscription]);

  const createCheckoutSession = async (
    priceId: string, 
    interval: 'month' | 'year', 
    successUrl: string,
    cancelUrl: string
  ) => {
    if (!isLoggedIn || !user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to purchase a subscription.',
        variant: 'destructive',
      });
      return null;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId,
          interval,
          email: user.email,
          success_url: successUrl,
          cancel_url: cancelUrl,
          customerId: subscriptionStripeCustomerId
        }
      });
      
      if (error) {
        console.error('Error creating checkout session:', error);
        toast({
          title: 'Error',
          description: 'Failed to create checkout session. Please try again later.',
          variant: 'destructive',
        });
        return null;
      }
      
      // Store customer ID in session storage for later use
      if (data.customerId) {
        sessionStorage.setItem('stripe_customer_id', data.customerId);
      }
      
      return data;
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Fetch subscription plans when component mounts
  useEffect(() => {
    fetchSubscriptionPlans();
  }, [fetchSubscriptionPlans]);

  // Fetch user subscription when user logs in or changes
  useEffect(() => {
    fetchUserSubscription();
  }, [fetchUserSubscription]);

  return {
    isLoading,
    plans,
    stripePublicKey,
    userSubscription,
    isSubscriptionLoading,
    fetchSubscriptionPlans,
    fetchUserSubscription,
    getCurrentPlan,
    isSubscriptionActive,
    hasAccess,
    createCheckoutSession
  };
}
