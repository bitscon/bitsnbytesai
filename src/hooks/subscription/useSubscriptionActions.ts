
import { useSubscribeAction } from './actions/useSubscribeAction';
import { useSubscriptionChangeAction } from './actions/useSubscriptionChangeAction';
import { useSubscriptionManagementAction } from './actions/useSubscriptionManagementAction';

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

/**
 * Central hook for all subscription-related actions
 * This hook composes multiple specialized hooks to provide a unified API
 */
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
  // Initialize subscription actions
  const { subscribe } = useSubscribeAction({
    userEmail,
    userId,
    subscriptionStripeCustomerId,
    setSubscribingStatus
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

  const { manageSubscription } = useSubscriptionManagementAction({
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    loadUserSubscription,
    setManagingStatus,
    updateCancelAtPeriodEnd
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
