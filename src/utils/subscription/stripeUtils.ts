
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Creates and redirects to a Stripe checkout session
 */
export async function createStripeCheckout(
  priceId: string, 
  interval: 'month' | 'year',
  userId?: string,
  customerId?: string | null
): Promise<{ success: boolean; message?: string }> {
  if (!priceId) {
    return { success: false, message: 'No price ID provided' };
  }
  
  try {
    // Get URLs for success and cancel pages
    const successUrl = `${window.location.origin}/subscription/success`;
    const cancelUrl = `${window.location.origin}/subscription`;
    
    // Get user email from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;
    
    if (!userEmail) {
      toast({
        title: 'Error',
        description: 'Please log in to subscribe',
        variant: 'destructive',
      });
      return { success: false, message: 'User not logged in' };
    }
    
    // Call the Supabase Edge Function to create a checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        interval,
        email: userEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customerId,
        userId: userId || user?.id
      }
    });
    
    if (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create checkout session',
        variant: 'destructive',
      });
      return { success: false, message: error.message };
    }
    
    if (!data || !data.url) {
      toast({
        title: 'Error',
        description: 'No checkout URL returned',
        variant: 'destructive',
      });
      return { success: false, message: 'No checkout URL returned' };
    }
    
    // Store Stripe customer ID in session storage for later use
    if (data.customerId) {
      sessionStorage.setItem('stripe_customer_id', data.customerId);
    }
    
    // Redirect to Stripe Checkout
    window.location.href = data.url;
    return { success: true };
    
  } catch (error: any) {
    console.error('Error in createStripeCheckout:', error);
    toast({
      title: 'Error',
      description: error.message || 'An unexpected error occurred',
      variant: 'destructive',
    });
    return { success: false, message: error.message };
  }
}

/**
 * Verifies a completed subscription
 */
export async function verifySubscription(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const customerId = sessionStorage.getItem('stripe_customer_id');
    
    const { data, error } = await supabase.functions.invoke('verify-subscription', {
      body: { 
        sessionId,
        userId,
        customerId
      }
    });
    
    if (error) {
      console.error('Error verifying subscription:', error);
      return { success: false, message: error.message };
    }
    
    if (!data || !data.success) {
      return { 
        success: false, 
        message: data?.message || 'Subscription verification failed' 
      };
    }
    
    return { success: true, data };
    
  } catch (error: any) {
    console.error('Error in verifySubscription:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Manages an existing subscription (cancel, reactivate, open portal)
 */
export async function manageStripeSubscription(
  action: 'portal' | 'cancel' | 'reactivate',
  userId: string,
  customerId?: string,
  subscriptionId?: string
): Promise<{ success: boolean; message?: string; url?: string }> {
  try {
    const body: any = { 
      action,
      userId
    };
    
    if (customerId) body.customerId = customerId;
    if (subscriptionId) body.subscriptionId = subscriptionId;
    
    const { data, error } = await supabase.functions.invoke('manage-subscription', { 
      body 
    });
    
    if (error) {
      console.error(`Error ${action}ing subscription:`, error);
      return { success: false, message: error.message };
    }
    
    if (action === 'portal' && data?.url) {
      return { success: true, url: data.url };
    }
    
    return { 
      success: true, 
      message: action === 'cancel' 
        ? 'Subscription will be canceled at the end of the current billing period' 
        : 'Subscription has been reactivated'
    };
    
  } catch (error: any) {
    console.error(`Error in manageStripeSubscription (${action}):`, error);
    return { success: false, message: error.message };
  }
}

/**
 * Changes an existing subscription to a new plan
 */
export async function changeStripeSubscription(
  subscriptionId: string,
  userId: string,
  priceId: string,
  interval: 'month' | 'year'
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('update-subscription', {
      body: {
        subscriptionId,
        userId,
        priceId,
        interval
      }
    });
    
    if (error) {
      console.error('Error updating subscription:', error);
      return { success: false, message: error.message };
    }
    
    return { 
      success: true, 
      message: 'Subscription updated successfully' 
    };
    
  } catch (error: any) {
    console.error('Error in changeStripeSubscription:', error);
    return { success: false, message: error.message };
  }
}
