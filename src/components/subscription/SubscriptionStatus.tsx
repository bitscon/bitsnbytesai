import { useEffect } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { logger } from '@/utils/logging';
import { ErrorBoundary } from '@/utils/logging';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ManageSubscription } from './ManageSubscription';
import { CheckCircle2, Circle } from 'lucide-react';

export function SubscriptionStatus() {
  const { 
    subscription, 
    isLoading, 
    error,
    loadUserSubscription,
    getTierName,
    formatDate
  } = useSubscription();

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        logger.info('Loading subscription status');
        await loadUserSubscription();
      } catch (error) {
        logger.error('Failed to load subscription', error as Error);
      }
    };

    loadSubscription();
  }, [loadUserSubscription]);

  // Log any subscription errors
  useEffect(() => {
    if (error) {
      logger.error('Subscription error occurred', error as Error);
    }
  }, [error]);

  // Log subscription status changes
  useEffect(() => {
    if (subscription) {
      logger.info('Subscription status updated', { 
        tier: subscription.tier,
        status: subscription.status,
        endDate: subscription.current_period_end
      });
    }
  }, [subscription]);

  return (
    <ErrorBoundary component="SubscriptionStatus">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton>Loading subscription status...</Skeleton>
            ) : error ? (
              "Failed to load subscription status."
            ) : subscription ? (
              `You are currently on the ${getTierName(subscription.tier)} plan.`
            ) : (
              "You do not have an active subscription."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-1">
              <Skeleton className="h-4 w-[20%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          ) : error ? (
            <div className="text-red-500">Error: {error.message}</div>
          ) : subscription ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>
                  Status: <Badge variant="secondary">{subscription.status}</Badge>
                </span>
              </div>
              <div>
                Current Period End: {formatDate(subscription.current_period_end)}
              </div>
            </div>
          ) : (
            <div>No active subscription.</div>
          )}
        </CardContent>
        {subscription && (
          <ManageSubscription />
        )}
      </Card>
    </ErrorBoundary>
  );
}
