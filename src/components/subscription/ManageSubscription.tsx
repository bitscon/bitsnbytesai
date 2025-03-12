
import React from 'react';
import { Button } from '@/components/ui/button';
import { useSubscriptionActions } from '@/hooks/subscription/useSubscriptionActions';
import { appLogger } from '@/utils/logging';

interface ManageSubscriptionProps {
  status: string;
  subscriptionId: string;
}

const ManageSubscription = ({ status, subscriptionId }: ManageSubscriptionProps) => {
  const { cancelSubscription, reactivateSubscription } = useSubscriptionActions();
  
  const handleCancelSubscription = async () => {
    try {
      appLogger.info('Canceling subscription', { subscriptionId });
      await cancelSubscription(subscriptionId);
    } catch (error) {
      appLogger.error('Failed to cancel subscription', error as Error, { subscriptionId });
    }
  };
  
  const handleReactivateSubscription = async () => {
    try {
      appLogger.info('Reactivating subscription', { subscriptionId });
      await reactivateSubscription(subscriptionId);
    } catch (error) {
      appLogger.error('Failed to reactivate subscription', error as Error, { subscriptionId });
    }
  };
  
  if (status === 'active') {
    return (
      <Button variant="outline" onClick={handleCancelSubscription} className="mt-2">
        Cancel Subscription
      </Button>
    );
  } else if (status === 'canceled') {
    return (
      <Button variant="outline" onClick={handleReactivateSubscription} className="mt-2">
        Reactivate Subscription
      </Button>
    );
  }
  
  return null;
};

export default ManageSubscription;
