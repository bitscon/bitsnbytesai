
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { invokeSupabaseFunction, storeSessionData, clearSessionData, getSessionData } from './paymentUtils';

/**
 * Creates and redirects to a Stripe checkout session
 */
export async function createStripeCheckout(
  priceId: string, 
  interval: 'month' | 'year',
  userId?: string,
  customerId?: string | null,
  pendingUserData?: {
    email: string;
    fullName: string;
    password: string;
  }
): Promise<{ success: boolean; message?: string }> {
  if (!priceId) {
    return { success: false, message: 'No price ID provided' };
  }
  
  try {
    // Get URLs for success and cancel pages
    const successUrl = `${window.location.origin}/subscription/success`;
    const cancelUrl = `${window.location.origin}/subscription`;
    
    // For new user flow, use the pending user data
    // For existing user flow, get user email from Supabase
    let userEmail: string | undefined;
    
    if (pendingUserData) {
      userEmail = pendingUserData.email;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      userEmail = user?.email;
      
      if (!userEmail) {
        toast({
          title: 'Error',
          description: 'Please log in to subscribe',
          variant: 'destructive',
        });
        return { success: false, message: 'User not logged in' };
      }
    }
    
    // Prepare the request body
    const requestBody: any = {
      priceId,
      interval,
      email: userEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customerId,
      userId: userId || "pending" // Will be updated after user creation
    };
    
    // Add pending user data if provided
    if (pendingUserData) {
      requestBody.pendingUserEmail = pendingUserData.email;
      requestBody.pendingUserFullName = pendingUserData.fullName;
      requestBody.pendingUserPassword = pendingUserData.password;
    }
    
    // Call the Supabase Edge Function to create a checkout session
    const result = await invokeSupabaseFunction('create-checkout-session', requestBody);
    
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
  userId?: string
): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const customerId = getSessionData('stripe_customer_id');
    
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
    clearSessionData('pending_user_email');
    clearSessionData('pending_user_fullname');
    clearSessionData('pending_user_password');
    
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

/**
 * Gets pending user data from session storage
 */
export function getPendingUserData(): { email: string; fullName: string; password: string } | null {
  const email = getSessionData('pending_user_email');
  const fullName = getSessionData('pending_user_fullname');
  const password = getSessionData('pending_user_password');
  
  if (email && fullName && password) {
    return { email, fullName, password };
  }
  
  return null;
}
