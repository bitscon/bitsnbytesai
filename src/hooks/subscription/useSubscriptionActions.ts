import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/subscription';
import { createCheckoutSession, manageSubscriptionAPI, updateSubscription } from '@/api/subscriptionAPI';
import { supabase } from '@/integrations/supabase/client';

interface UseSubscriptionActionsProps {
  userEmail?: string;
  userId?: string;
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
  userId,
  subscriptionStripeCustomerId,
  stripeCustomerId,
  stripeSubscriptionId,
  loadUserSubscription,
  setSubscribingStatus,
  setManagingStatus,
  updateCancelAtPeriodEnd
}: UseSubscriptionActionsProps) {
  const { toast } = useToast();
  const [isChangingSubscription, setIsChangingSubscription] = useState(false);
  const [changeSubscriptionError, setChangeSubscriptionError] = useState('');
  const [changeSubscriptionSuccess, setChangeSubscriptionSuccess] = useState('');

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
        subscriptionStripeCustomerId,
        userId
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
  }, [userEmail, userId, subscriptionStripeCustomerId, toast, setSubscribingStatus]);

  /**
   * Changes an existing subscription to a new plan
   */
  const changeSubscription = useCallback(async (planId: string, interval: 'month' | 'year') => {
    if (!userId || !stripeSubscriptionId) {
      setChangeSubscriptionError('You must have an active subscription to change plans.');
      return;
    }
    
    try {
      setIsChangingSubscription(true);
      setChangeSubscriptionError('');
      setChangeSubscriptionSuccess('');
      
      // Find the plan and get the price ID
      const plan = await getPlanById(planId);
      if (!plan) {
        setChangeSubscriptionError('Selected plan not found.');
        return;
      }
      
      const priceId = interval === 'month' 
        ? plan.stripe_price_id_monthly 
        : plan.stripe_price_id_yearly;
        
      if (!priceId) {
        setChangeSubscriptionError(`No ${interval}ly price available for selected plan.`);
        return;
      }
      
      // Call the API to update the subscription
      const { data, error } = await updateSubscription(
        stripeSubscriptionId,
        userId,
        priceId,
        interval
      );
      
      if (error) {
        console.error('Error updating subscription:', error);
        setChangeSubscriptionError('Failed to update subscription. Please try again.');
        return;
      }
      
      // Update successful
      setChangeSubscriptionSuccess(`Your subscription has been updated to the ${plan.name} plan.`);
      toast({
        title: 'Subscription Updated',
        description: `Your subscription has been changed to the ${plan.name} plan.`,
      });
      
      // Refresh subscription data
      await loadUserSubscription();
      
    } catch (error) {
      console.error('Error in changeSubscription:', error);
      setChangeSubscriptionError('An unexpected error occurred. Please try again.');
    } finally {
      setIsChangingSubscription(false);
    }
  }, [userId, stripeSubscriptionId, toast, loadUserSubscription]);

  // Helper function to get plan by ID
  const getPlanById = async (planId: string): Promise<SubscriptionPlan | null> => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();
        
      return data;
    } catch (error) {
      console.error('Error fetching plan details:', error);
      return null;
    }
  };

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
    manageSubscription,
    changeSubscription,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess
  };
}
