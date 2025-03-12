
import { useCallback } from 'react';
import { manageStripeSubscription } from '@/utils/subscription/managementUtils';
import { subscriptionEvents } from '@/utils/subscription/subscriptionLogger';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionTier } from '@/types/subscription';

interface UseSubscriptionManagementProps {
  userId?: string;
  userEmail?: string;
  stripeSubscriptionId?: string;
  subscriptionStripeCustomerId: string | null;
  setManagingStatus: (status: boolean) => void;
  updateCancelAtPeriodEnd: (status: boolean) => void;
  loadUserSubscription: () => Promise<void>;
}

export function useSubscriptionManagement({
  userId,
  userEmail,
  stripeSubscriptionId,
  subscriptionStripeCustomerId,
  setManagingStatus,
  updateCancelAtPeriodEnd,
  loadUserSubscription
}: UseSubscriptionManagementProps) {
  const { toast } = useToast();

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
  }, [userId, userEmail, stripeSubscriptionId, subscriptionStripeCustomerId, setManagingStatus, updateCancelAtPeriodEnd, loadUserSubscription, toast]);

  return { manageSubscription };
}
