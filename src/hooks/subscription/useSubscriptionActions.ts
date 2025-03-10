
import { useSubscribe } from './actions/useSubscribe';
import { useSubscriptionChange } from './actions/useSubscriptionChange';
import { useSubscriptionManagement } from './actions/useSubscriptionManagement';

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
  // Initialize subscription actions
  const { subscribe } = useSubscribe({
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
  } = useSubscriptionChange({
    userId,
    stripeSubscriptionId,
    loadUserSubscription
  });

  const { manageSubscription } = useSubscriptionManagement({
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
