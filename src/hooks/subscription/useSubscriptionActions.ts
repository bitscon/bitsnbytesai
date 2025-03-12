
import { useSubscribeAction } from './actions/useSubscribeAction';
import { useSubscriptionManagementAction } from './actions/useSubscriptionManagementAction';
import { useSubscriptionChangeAction } from './actions/useSubscriptionChangeAction';

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
  // Use the subscription action hooks
  const { subscribe } = useSubscribeAction({
    userEmail, 
    userId, 
    stripeCustomerId, 
    setSubscribingStatus
  });
  
  const { manageSubscription } = useSubscriptionManagementAction({
    userId,
    userEmail,
    stripeSubscriptionId,
    subscriptionStripeCustomerId,
    setManagingStatus,
    updateCancelAtPeriodEnd,
    loadUserSubscription
  });
  
  const {
    changeSubscription,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess
  } = useSubscriptionChangeAction({
    userId,
    stripeSubscriptionId,
    loadUserSubscription
  });

  return {
    subscribe,
    manageSubscription,
    changeSubscription,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess
  };
}
