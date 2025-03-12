
import { useSubscriptionChange } from './useSubscriptionChange';

export function useSubscriptionChangeAction({
  userId,
  stripeSubscriptionId,
  loadUserSubscription
}: {
  userId?: string;
  stripeSubscriptionId?: string;
  loadUserSubscription: () => Promise<void>;
}) {
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

  return {
    changeSubscription,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess
  };
}
