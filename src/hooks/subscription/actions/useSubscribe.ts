
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createStripeCheckout } from '@/utils/subscription/stripeUtils';

interface UseSubscribeProps {
  userEmail?: string;
  userId?: string;
  subscriptionStripeCustomerId: string | null;
  setSubscribingStatus: (status: boolean) => void;
}

export function useSubscribe({
  userEmail,
  userId,
  subscriptionStripeCustomerId,
  setSubscribingStatus
}: UseSubscribeProps) {
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
      
      const result = await createStripeCheckout(
        priceId,
        interval,
        userId,
        subscriptionStripeCustomerId
      );
      
      if (!result.success) {
        toast({
          title: 'Error',
          description: result.message || 'Failed to create subscription checkout.',
          variant: 'destructive',
        });
      }
      
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

  return { subscribe };
}
