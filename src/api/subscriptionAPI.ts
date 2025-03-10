
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Creates a checkout session for a subscription
 */
export const createCheckoutSession = async (
  priceId: string, 
  interval: 'month' | 'year',
  successUrl: string,
  cancelUrl: string,
  userEmail?: string,
  customerId?: string | null,
  userId?: string
) => {
  if (!userEmail) {
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
        email: userEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customerId,
        userId
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

/**
 * Fetches subscription plans from the server
 */
export const fetchSubscriptionPlans = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-subscription-plans');
    
    if (error) {
      console.error('Error fetching subscription plans:', error);
      return { error, plans: [], stripePublicKey: '' };
    }
    
    return { 
      plans: data.plans || [], 
      stripePublicKey: data.stripePublicKey || '',
      error: null
    };
  } catch (error) {
    console.error('Error in fetchSubscriptionPlans:', error);
    return { error, plans: [], stripePublicKey: '' };
  }
};

/**
 * Fetches a user's Stripe subscription details
 */
export const fetchStripeSubscription = async (subscriptionId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('get-user-subscription', {
      body: {
        subscriptionId
      }
    });
    
    if (error) {
      console.error('Error fetching Stripe subscription details:', error);
      return { error, subscription: null };
    }
    
    return { subscription: data?.subscription || null, error: null };
  } catch (error) {
    console.error('Error in fetchStripeSubscription:', error);
    return { error, subscription: null };
  }
};

/**
 * Manages a subscription (cancel, reactivate, open portal)
 */
export const manageSubscriptionAPI = async (
  action: 'portal' | 'cancel' | 'reactivate',
  customerId?: string,
  subscriptionId?: string,
  returnUrl?: string
) => {
  try {
    const body: any = { action };
    
    if (action === 'portal') {
      if (!customerId) return { error: 'Customer ID is required' };
      body.customerId = customerId;
      body.return_url = returnUrl;
    } else {
      if (!subscriptionId) return { error: 'Subscription ID is required' };
      body.subscriptionId = subscriptionId;
    }
    
    const { data, error } = await supabase.functions.invoke('manage-subscription', { body });
    
    if (error) {
      console.error(`Error ${action}ing subscription:`, error);
      return { error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error in manageSubscriptionAPI (${action}):`, error);
    return { error };
  }
};
