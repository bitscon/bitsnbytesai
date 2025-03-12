
import { useSubscriptionManagement } from './useSubscriptionManagement';

export function useSubscriptionManagementAction({
  userId,
  userEmail,
  stripeSubscriptionId,
  subscriptionStripeCustomerId,
  setManagingStatus,
  updateCancelAtPeriodEnd,
  loadUserSubscription
}: {
  userId?: string;
  userEmail?: string;
  stripeSubscriptionId?: string;
  subscriptionStripeCustomerId: string | null;
  setManagingStatus: (status: boolean) => void;
  updateCancelAtPeriodEnd: (status: boolean) => void;
  loadUserSubscription: () => Promise<void>;
}) {
  const { manageSubscription } = useSubscriptionManagement({
    userId,
    userEmail,
    stripeSubscriptionId,
    subscriptionStripeCustomerId,
    setManagingStatus,
    updateCancelAtPeriodEnd,
    loadUserSubscription
  });

  return { manageSubscription };
}
