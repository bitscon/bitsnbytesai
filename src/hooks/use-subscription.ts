
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan, UserSubscription, SubscriptionTier, PromptUsage } from '@/types/subscription';
import { format } from 'date-fns';

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

export function useSubscription() {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
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
        
        // If subscription is not free tier, fetch Stripe details
        if (subscriptionData.tier !== 'free' && subscriptionData.stripe_subscription_id) {
          const { data: stripeData, error: stripeError } = await supabase.functions.invoke('get-user-subscription', {
            body: {
              subscriptionId: subscriptionData.stripe_subscription_id
            }
          });
          
          if (stripeError) {
            console.error('Error fetching Stripe subscription details:', stripeError);
          } else if (stripeData?.subscription) {
            setStripeSubscription(stripeData.subscription);
            setCancelAtPeriodEnd(stripeData.subscription.cancel_at_period_end);
          }
        }
        
        // Fetch current usage if on free tier
        if (subscriptionData.tier === 'free') {
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          
          const { data: usageData, error: usageError } = await supabase
            .from('user_prompt_usage')
            .select('count')
            .eq('user_id', user.id)
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
        }
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

  const subscribe = async (priceId: string, interval: 'month' | 'year') => {
    if (!isLoggedIn || !user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to purchase a subscription.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubscribing(true);
      
      const successUrl = `${window.location.origin}/subscription/success`;
      const cancelUrl = `${window.location.origin}/subscription`;
      
      const { data, error } = await createCheckoutSession(
        priceId,
        interval,
        successUrl,
        cancelUrl
      );
      
      if (error || !data || !data.url) {
        console.error('Error creating subscription checkout:', error || 'No checkout URL returned');
        toast({
          title: 'Error',
          description: 'Failed to create subscription checkout. Please try again later.',
          variant: 'destructive',
        });
        return;
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error in subscribe function:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const manageSubscription = async (action: 'portal' | 'cancel' | 'reactivate') => {
    if (!isLoggedIn || !user || !userSubscription) {
      toast({
        title: 'Error',
        description: 'You must be logged in and have a subscription to manage it.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsManagingSubscription(true);
      
      const returnUrl = `${window.location.origin}/subscription`;
      
      if (action === 'portal') {
        // Open Stripe Customer Portal
        const { data, error } = await supabase.functions.invoke('manage-subscription', {
          body: {
            customerId: userSubscription.stripe_customer_id,
            action: 'portal',
            return_url: returnUrl
          }
        });
        
        if (error || !data || !data.url) {
          console.error('Error opening customer portal:', error || 'No portal URL returned');
          toast({
            title: 'Error',
            description: 'Failed to open subscription management. Please try again later.',
            variant: 'destructive',
          });
          return;
        }
        
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else if (action === 'cancel' || action === 'reactivate') {
        // Cancel or reactivate subscription
        const { error } = await supabase.functions.invoke('manage-subscription', {
          body: {
            subscriptionId: userSubscription.stripe_subscription_id,
            action: action,
          }
        });
        
        if (error) {
          console.error(`Error ${action}ing subscription:`, error);
          toast({
            title: 'Error',
            description: `Failed to ${action} subscription. Please try again later.`,
            variant: 'destructive',
          });
          return;
        }
        
        setCancelAtPeriodEnd(action === 'cancel');
        
        toast({
          title: action === 'cancel' ? 'Subscription Cancelled' : 'Subscription Reactivated',
          description: action === 'cancel' 
            ? 'Your subscription will end at the end of the current billing period.' 
            : 'Your subscription has been reactivated and will renew automatically.',
        });
        
        // Refresh subscription data
        fetchUserSubscription();
      }
    } catch (error) {
      console.error(`Error in manageSubscription (${action}):`, error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const getTierName = (tier: SubscriptionTier): string => {
    switch (tier) {
      case 'free':
        return 'Free';
      case 'pro':
        return 'Pro';
      case 'premium':
        return 'Premium';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

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
      return { error: 'User not logged in' };
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
        return { error };
      }
      
      // Store customer ID in session storage for later use
      if (data.customerId) {
        sessionStorage.setItem('stripe_customer_id', data.customerId);
      }
      
      return { data };
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      return { error };
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
    subscription: userSubscription, // Alias for backward compatibility
    stripeSubscription,
    cancelAtPeriodEnd,
    currentUsage,
    isSubscribing,
    isManagingSubscription,
    isSubscriptionLoading,
    fetchSubscriptionPlans,
    fetchUserSubscription,
    getCurrentPlan,
    isSubscriptionActive,
    hasAccess,
    createCheckoutSession,
    subscribe,
    manageSubscription,
    getTierName,
    formatDate
  };
}
