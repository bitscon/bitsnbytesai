
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { manageStripeSubscription } from '@/utils/subscription/stripeUtils';

interface UseSubscriptionManagementProps {
  userId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  loadUserSubscription: () => Promise<void>;
  setManagingStatus: (status: boolean) => void;
  updateCancelAtPeriodEnd: (status: boolean) => void;
}

export function useSubscriptionManagement({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  loadUserSubscription,
  setManagingStatus,
  updateCancelAtPeriodEnd
}: UseSubscriptionManagementProps) {
  const { toast } = useToast();

  /**
   * Manages subscription (cancel, reactivate, or open portal)
   */
  const manageSubscription = useCallback(async (action: 'portal' | 'cancel' | 'reactivate') => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in and have a subscription to manage it.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setManagingStatus(true);
      
      if (action === 'portal') {
        // Open Stripe Customer Portal
        const result = await manageStripeSubscription(
          'portal',
          userId,
          stripeCustomerId
        );
        
        if (!result.success) {
          toast({
            title: 'Error',
            description: result.message || 'Failed to open subscription management.',
            variant: 'destructive',
          });
          return;
        }
        
        // Redirect to Stripe Customer Portal
        if (result.url) {
          window.location.href = result.url;
        }
      } else if (action === 'cancel' || action === 'reactivate') {
        // Cancel or reactivate subscription
        const result = await manageStripeSubscription(
          action,
          userId,
          undefined,
          stripeSubscriptionId
        );
        
        if (!result.success) {
          toast({
            title: 'Error',
            description: result.message || `Failed to ${action} subscription.`,
            variant: 'destructive',
          });
          return;
        }
        
        updateCancelAtPeriodEnd(action === 'cancel');
        
        toast({
          title: action === 'cancel' ? 'Subscription Cancelled' : 'Subscription Reactivated',
          description: result.message || (action === 'cancel' 
            ? 'Your subscription will end at the end of the current billing period.' 
            : 'Your subscription has been reactivated and will renew automatically.'),
        });
        
        // Refresh subscription data
        loadUserSubscription();
      }
    } catch (error: any) {
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
    userId, 
    stripeCustomerId,
    stripeSubscriptionId,
    toast,
    setManagingStatus,
    updateCancelAtPeriodEnd,
    loadUserSubscription
  ]);

  return { manageSubscription };
}
