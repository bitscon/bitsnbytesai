
import { useState, useCallback } from 'react';
import { changeStripeSubscription } from '@/utils/subscription/managementUtils';
import { subscriptionEvents } from '@/utils/subscription/subscriptionLogger';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionTier } from '@/types/subscription';

interface UseSubscriptionChangeProps {
  userId?: string;
  stripeSubscriptionId?: string;
  loadUserSubscription: () => Promise<void>;
}

export function useSubscriptionChange({
  userId,
  stripeSubscriptionId,
  loadUserSubscription
}: UseSubscriptionChangeProps) {
  const [isChangingSubscription, setIsChangingSubscription] = useState(false);
  const [changeSubscriptionError, setChangeSubscriptionError] = useState('');
  const [changeSubscriptionSuccess, setChangeSubscriptionSuccess] = useState(false);
  const { toast } = useToast();

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
  }, [userId, stripeSubscriptionId, loadUserSubscription, toast]);

  return {
    changeSubscription,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess
  };
}
