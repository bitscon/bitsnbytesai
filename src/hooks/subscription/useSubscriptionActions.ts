
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/subscription';
import { createCheckoutSession, manageSubscriptionAPI } from '@/api/subscriptionAPI';

interface UseSubscriptionActionsProps {
  userEmail?: string;
  subscriptionStripeCustomerId: string | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  loadUserSubscription: () => Promise<void>;
  setSubscribingStatus: (status: boolean) => void;
  setManagingStatus: (status: boolean) => void;
  updateCancelAtPeriodEnd: (status: boolean) => void;
}

export function useSubscriptionActions({
  userEmail,
  subscriptionStripeCustomerId,
  stripeCustomerId,
  stripeSubscriptionId,
  loadUserSubscription,
  setSubscribingStatus,
  setManagingStatus,
  updateCancelAtPeriodEnd
}: UseSubscriptionActionsProps) {
  const { toast } = useToast();

  /**
   * Initiates subscription checkout process
   */
  const subscribe = useCallback(async (priceId: string, interval: 'month' | 'year') => {
    if (!userEmail) {
      toast({
        title: 'Error',
        description: 'You must be logged in to purchase a subscription.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSubscribingStatus(true);
      
      const successUrl = `${window.location.origin}/subscription/success`;
      const cancelUrl = `${window.location.origin}/subscription`;
      
      const { data, error } = await createCheckoutSession(
        priceId,
        interval,
        successUrl,
        cancelUrl,
        userEmail,
        subscriptionStripeCustomerId
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
      setSubscribingStatus(false);
    }
  }, [userEmail, subscriptionStripeCustomerId, toast, setSubscribingStatus]);

  /**
   * Manages subscription (cancel, reactivate, or open portal)
   */
  const manageSubscription = useCallback(async (action: 'portal' | 'cancel' | 'reactivate') => {
    if (!userEmail) {
      toast({
        title: 'Error',
        description: 'You must be logged in and have a subscription to manage it.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setManagingStatus(true);
      
      const returnUrl = `${window.location.origin}/subscription`;
      
      if (action === 'portal') {
        // Open Stripe Customer Portal
        const { data, error } = await manageSubscriptionAPI(
          'portal',
          stripeCustomerId,
          undefined,
          returnUrl
        );
        
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
        const { error } = await manageSubscriptionAPI(
          action,
          undefined,
          stripeSubscriptionId
        );
        
        if (error) {
          console.error(`Error ${action}ing subscription:`, error);
          toast({
            title: 'Error',
            description: `Failed to ${action} subscription. Please try again later.`,
            variant: 'destructive',
          });
          return;
        }
        
        updateCancelAtPeriodEnd(action === 'cancel');
        
        toast({
          title: action === 'cancel' ? 'Subscription Cancelled' : 'Subscription Reactivated',
          description: action === 'cancel' 
            ? 'Your subscription will end at the end of the current billing period.' 
            : 'Your subscription has been reactivated and will renew automatically.',
        });
        
        // Refresh subscription data
        loadUserSubscription();
      }
    } catch (error) {
      console.error(`Error in manageSubscription (${action}):`, error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setManagingStatus(false);
    }
  }, [
    userEmail, 
    stripeCustomerId,
    stripeSubscriptionId,
    toast,
    setManagingStatus,
    updateCancelAtPeriodEnd,
    loadUserSubscription
  ]);

  return {
    subscribe,
    manageSubscription
  };
}
