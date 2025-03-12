
import { useCallback, useState } from 'react';
import { createStripeCheckout } from '@/utils/subscription/checkoutUtils';
import { manageStripeSubscription, changeStripeSubscription } from '@/utils/subscription/managementUtils';
import { toast } from '@/hooks/use-toast';
import { subscriptionEvents } from '@/utils/subscription/subscriptionLogger';
import { useAuth } from '@/context/auth';
import { SubscriptionTier } from '@/types/subscription';

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
  const [isChangingSubscription, setIsChangingSubscription] = useState(false);
  const [changeSubscriptionError, setChangeSubscriptionError] = useState('');
  const [changeSubscriptionSuccess, setChangeSubscriptionSuccess] = useState(false);
  const { user } = useAuth();

  const subscribe = useCallback(async (priceId: string, interval: 'month' | 'year') => {
    if (!userEmail || !userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to subscribe',
        variant: 'destructive',
      });
      return;
    }
    
    setSubscribingStatus(true);
    
    try {
      subscriptionEvents.logCheckoutInitiated(userId, 'free' as SubscriptionTier, priceId, interval);
      
      const result = await createStripeCheckout(
        priceId,
        interval,
        userId,
        stripeCustomerId
      );
      
      if (!result.success) {
        subscriptionEvents.logCheckoutAbandoned(userId, 'free' as SubscriptionTier);
        toast({
          title: 'Error',
          description: result.message || 'Failed to create checkout session',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error in subscribe:', error);
      subscriptionEvents.logCheckoutAbandoned(userId, 'free' as SubscriptionTier);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubscribingStatus(false);
    }
  }, [userEmail, userId, stripeCustomerId, setSubscribingStatus]);

  const manageSubscription = useCallback(async (action: 'portal' | 'cancel' | 'reactivate') => {
    if (!userId || !userEmail) {
      toast({
        title: 'Error',
        description: 'You must be logged in to manage your subscription',
        variant: 'destructive',
      });
      return;
    }
    
    if (action !== 'portal' && !stripeSubscriptionId) {
      toast({
        title: 'Error',
        description: 'No active subscription found',
        variant: 'destructive',
      });
      return;
    }
    
    setManagingStatus(true);
    
    try {
      if (action === 'cancel') {
        subscriptionEvents.logSubscriptionCanceled(userId, stripeSubscriptionId || '', 'free' as SubscriptionTier, false);
      } else if (action === 'reactivate') {
        subscriptionEvents.logSubscriptionReactivated(userId, stripeSubscriptionId || '', 'free' as SubscriptionTier);
      }
      
      const result = await manageStripeSubscription(
        action,
        userId,
        subscriptionStripeCustomerId,
        stripeSubscriptionId
      );
      
      if (!result.success) {
        toast({
          title: 'Error',
          description: result.message || `Failed to ${action} subscription`,
          variant: 'destructive',
        });
        return;
      }
      
      if (action === 'cancel') {
        updateCancelAtPeriodEnd(true);
        toast({
          title: 'Subscription Canceled',
          description: 'Your subscription will be canceled at the end of the current billing period',
        });
      } else if (action === 'reactivate') {
        updateCancelAtPeriodEnd(false);
        toast({
          title: 'Subscription Reactivated',
          description: 'Your subscription has been reactivated',
        });
      } else if (action === 'portal' && result.url) {
        window.location.href = result.url;
      }
      
      await loadUserSubscription();
    } catch (error: any) {
      console.error(`Error in manageSubscription (${action}):`, error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setManagingStatus(false);
    }
  }, [userId, userEmail, stripeSubscriptionId, subscriptionStripeCustomerId, setManagingStatus, updateCancelAtPeriodEnd, loadUserSubscription]);

  const changeSubscription = useCallback(async (planId: string, interval: 'month' | 'year') => {
    if (!userId || !stripeSubscriptionId) {
      toast({
        title: 'Error',
        description: 'You must have an active subscription to change it',
        variant: 'destructive',
      });
      return;
    }
    
    setIsChangingSubscription(true);
    setChangeSubscriptionError('');
    setChangeSubscriptionSuccess(false);
    
    try {
      subscriptionEvents.logSubscriptionUpdated(userId, stripeSubscriptionId, 'free' as SubscriptionTier, 'free' as SubscriptionTier, 'other');
      
      const result = await changeStripeSubscription(
        stripeSubscriptionId,
        userId,
        planId,
        interval
      );
      
      if (!result.success) {
        setChangeSubscriptionError(result.message || 'Failed to update subscription');
        toast({
          title: 'Error',
          description: result.message || 'Failed to update subscription',
          variant: 'destructive',
        });
        return;
      }
      
      setChangeSubscriptionSuccess(true);
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription has been successfully updated',
      });
      
      await loadUserSubscription();
    } catch (error: any) {
      console.error('Error in changeSubscription:', error);
      setChangeSubscriptionError(error.message || 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsChangingSubscription(false);
    }
  }, [userId, stripeSubscriptionId, loadUserSubscription]);

  return {
    subscribe,
    manageSubscription,
    changeSubscription,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess
  };
}
