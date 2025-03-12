
import { useSubscribe } from './useSubscribe';

export function useSubscribeAction({
  userEmail,
  userId,
  stripeCustomerId,
  setSubscribingStatus
}: {
  userEmail?: string;
  userId?: string;
  stripeCustomerId?: string;
  setSubscribingStatus: (status: boolean) => void;
}) {
  const { subscribe } = useSubscribe({
    userEmail,
    userId,
    stripeCustomerId,
    setSubscribingStatus
  });

  return { subscribe };
}
