
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: {
    [key: string]: any;
    description: string;
  };
}

export interface UserSubscription {
  id?: string;
  user_id?: string;
  tier: SubscriptionTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
}

export interface StripeSubscription {
  id: string;
  status: string;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  plan: {
    id: string;
    nickname: string;
    amount: number;
    interval: string;
  };
}

export interface UsageData {
  count: number;
  limit: number;
  remaining: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stripePublicKey, setStripePublicKey] = useState<string | null>(null);
  const [stripeSubscription, setStripeSubscription] = useState<StripeSubscription | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [currentUsage, setCurrentUsage] = useState<UsageData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-subscription-plans');
      
      if (error) {
        console.error('Error fetching plans:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription plans.",
          variant: "destructive",
        });
        return;
      }
      
      setPlans(data.plans || []);
      setStripePublicKey(data.stripePublicKey);
    } catch (error) {
      console.error('Error in fetchPlans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans.",
        variant: "destructive",
      });
    }
  };

  // Fetch user subscription
  const fetchUserSubscription = async () => {
    if (!user) {
      setSubscription({ tier: 'free' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-user-subscription', {
        body: { userId: user.id }
      });
      
      if (error) {
        console.error('Error fetching subscription:', error);
        toast({
          title: "Error",
          description: "Failed to load your subscription details.",
          variant: "destructive",
        });
        setSubscription({ tier: 'free' });
        return;
      }
      
      setSubscription(data.subscription);
      setStripeSubscription(data.stripeSubscription);
      setCancelAtPeriodEnd(data.cancelAtPeriodEnd);
      setCurrentUsage(data.currentUsage);
      setCurrentPlan(data.planDetails);
    } catch (error) {
      console.error('Error in fetchUserSubscription:', error);
      toast({
        title: "Error",
        description: "Failed to load your subscription details.",
        variant: "destructive",
      });
      setSubscription({ tier: 'free' });
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to a plan
  const subscribe = async (priceId: string, interval: 'month' | 'year') => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId,
          interval,
          email: user.email,
          customerId: subscription?.stripe_customer_id,
          success_url: `${window.location.origin}/subscription/success`,
          cancel_url: `${window.location.origin}/subscription`,
        }
      });
      
      if (error) {
        console.error('Error creating subscription:', error);
        toast({
          title: "Error",
          description: "Failed to initiate subscription. Please try again.",
          variant: "destructive",
        });
        return null;
      }
      
      // Store customer ID in session storage for verification
      if (data.customerId) {
        sessionStorage.setItem('stripe_customer_id', data.customerId);
      }
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
      
      return data;
    } catch (error) {
      console.error('Error in subscribe:', error);
      toast({
        title: "Error",
        description: "Failed to initiate subscription. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSubscribing(false);
    }
  };

  // Manage subscription (cancel, reactivate)
  const manageSubscription = async (action: 'cancel' | 'reactivate' | 'portal') => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to manage your subscription.",
        variant: "destructive",
      });
      return;
    }

    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action,
          userId: user.id
        }
      });
      
      if (error) {
        console.error(`Error ${action} subscription:`, error);
        toast({
          title: "Error",
          description: `Failed to ${action} subscription. Please try again.`,
          variant: "destructive",
        });
        return null;
      }
      
      if (action === 'cancel') {
        toast({
          title: "Success",
          description: "Your subscription will be canceled at the end of the billing period.",
        });
        setCancelAtPeriodEnd(true);
      } else if (action === 'reactivate') {
        toast({
          title: "Success",
          description: "Your subscription has been reactivated.",
        });
        setCancelAtPeriodEnd(false);
      } else if (action === 'portal' && data.url) {
        window.location.href = data.url;
      }
      
      return data;
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} subscription. Please try again.`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsManagingSubscription(false);
    }
  };

  // Get the tier name in a user-friendly format
  const getTierName = (tier: SubscriptionTier): string => {
    switch (tier) {
      case 'free': return 'Free';
      case 'pro': return 'Pro';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      default: return 'Unknown';
    }
  };

  // Determine if the user can access a feature based on their subscription tier
  const canAccess = (requiredTier: SubscriptionTier): boolean => {
    if (!subscription) return false;
    
    const tierLevels: Record<SubscriptionTier, number> = {
      'free': 0,
      'pro': 1,
      'premium': 2,
      'enterprise': 3
    };
    
    return tierLevels[subscription.tier] >= tierLevels[requiredTier];
  };

  // Format subscription dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Load data when user changes
  useEffect(() => {
    fetchPlans();
    fetchUserSubscription();
  }, [user?.id]);

  return {
    isLoading,
    subscription,
    plans,
    stripePublicKey,
    stripeSubscription,
    cancelAtPeriodEnd,
    currentUsage,
    currentPlan,
    isSubscribing,
    isManagingSubscription,
    fetchUserSubscription,
    subscribe,
    manageSubscription,
    getTierName,
    canAccess,
    formatDate
  };
}
