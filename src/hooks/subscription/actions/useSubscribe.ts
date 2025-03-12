
import { useState, useCallback } from 'react';
import { createStripeCheckout } from '@/utils/subscription/checkoutUtils';
import { subscriptionEvents } from '@/utils/subscription/subscriptionLogger';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionTier } from '@/types/subscription';

interface UseSubscribeProps {
  userEmail?: string;
  userId?: string;
  stripeCustomerId?: string;
  setSubscribingStatus: (status: boolean) => void;
}

export function useSubscribe({
  userEmail,
  userId,
  stripeCustomerId,
  setSubscribingStatus
}: UseSubscribeProps) {
  const { toast } = useToast();

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
  }, [userEmail, userId, stripeCustomerId, setSubscribingStatus, toast]);

  return { subscribe };
}
