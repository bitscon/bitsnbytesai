
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { invokeSupabaseFunction, storeSessionData, clearSessionData } from './paymentUtils';

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
    const result = await invokeSupabaseFunction('create-checkout-session', {
      priceId,
      interval,
      email: userEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customerId,
      userId: userId || user?.id
    });
    
    if (!result.success) {
      toast({
        title: 'Error',
        description: 'Failed to create checkout session',
        variant: 'destructive',
      });
      return { success: false, message: result.message };
    }
    
    const data = result.data;
    
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
      storeSessionData('stripe_customer_id', data.customerId);
    }
    
    // Store checkout session ID for verification
    if (data.sessionId) {
      storeSessionData('checkout_session_id', data.sessionId);
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
    
    const result = await invokeSupabaseFunction('verify-subscription', {
      sessionId,
      userId,
      customerId
    });
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    // Clear session storage after successful verification
    clearSessionData('stripe_customer_id');
    clearSessionData('checkout_session_id');
    
    return { success: true, data: result.data };
    
  } catch (error: any) {
    console.error('Error in verifySubscription:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Retrieves the checkout session ID from the URL query parameters
 */
export function getCheckoutSessionIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('session_id');
}
