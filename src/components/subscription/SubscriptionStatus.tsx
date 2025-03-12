
import React from 'react';
import { Button } from '@/components/ui/button';
import { appLogger } from '@/utils/logging';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import ManageSubscription from './ManageSubscription';

export const SubscriptionStatus = () => {
  const subscription = useSubscription();
  
  if (subscription.isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Loading your subscription information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!subscription.userSubscription) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>You don't have an active subscription.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <a href="/subscription-signup">Subscribe Now</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'canceled':
        return <Badge className="bg-yellow-500">Canceled</Badge>;
      case 'expired':
        return <Badge className="bg-red-500">Expired</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMMM d, yyyy');
  };
  
  // Log subscription data
  appLogger.info('Rendering subscription status', {
    subscriptionId: subscription.userSubscription.id,
    tier: subscription.userSubscription.tier,
    status: subscription.userSubscription.status || 'unknown'
  });
  
  return (
    <ErrorBoundary>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription Status</span>
            {subscription.userSubscription.status && getStatusBadge(subscription.userSubscription.status)}
          </CardTitle>
          <CardDescription>
            {subscription.userSubscription.status === 'active' 
              ? 'Your subscription is currently active.' 
              : 'Your subscription is not active.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Plan:</p>
            <p className="capitalize">{subscription.userSubscription.tier || 'Free'}</p>
          </div>
          
          {subscription.userSubscription.current_period_end && (
            <div>
              <p className="text-sm font-medium">Next billing date:</p>
              <p>{formatDate(subscription.userSubscription.current_period_end)}</p>
            </div>
          )}
          
          {subscription.userSubscription.status && (
            <ManageSubscription 
              status={subscription.userSubscription.status} 
              subscriptionId={subscription.userSubscription.id}
            />
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};
