
import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SubscriptionHeader } from '@/components/subscription/SubscriptionHeader';
import { SubscriptionDetails } from '@/components/subscription/SubscriptionDetails';
import { BillingIntervalSelector } from '@/components/subscription/BillingIntervalSelector';
import { PlansList } from '@/components/subscription/PlansList';
import { SubscriptionPageWrapper } from '@/components/subscription/SubscriptionPageWrapper';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Subscription() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [retryCount, setRetryCount] = useState<number>(0);
  const { isLoggedIn, user } = useAuth();
  const { toast } = useToast();
  
  const {
    isLoading,
    subscription,
    plans,
    stripeSubscription,
    cancelAtPeriodEnd,
    currentUsage,
    isSubscribing,
    isManagingSubscription,
    isSubscriptionLoading,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess,
    loadUserSubscription,
    fetchError,
    subscribe,
    manageSubscription,
    changeSubscription,
    getTierName,
    formatDate
  } = useSubscription();

  useEffect(() => {
    if (isLoggedIn && user) {
      loadUserSubscription();
    }
  }, [isLoggedIn, user, loadUserSubscription]);

  const visiblePlans = plans?.filter(plan => plan.is_visible !== false) || [];
  const avgMonthlyPrice = visiblePlans.length 
    ? visiblePlans.reduce((sum, plan) => sum + plan.price_monthly, 0) / visiblePlans.length 
    : 0;
  const avgYearlyPrice = visiblePlans.length 
    ? visiblePlans.reduce((sum, plan) => sum + plan.price_yearly, 0) / visiblePlans.length 
    : 0;

  const handleSubscribe = async (planId: string) => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive"
      });
      return;
    }
    
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    const priceId = billingInterval === 'month' 
      ? plan.stripe_price_id_monthly 
      : plan.stripe_price_id_yearly;
    
    if (!priceId) {
      toast({
        title: "Invalid plan",
        description: "This plan is not available for purchase",
        variant: "destructive"
      });
      return;
    }
    
    await subscribe(priceId, billingInterval);
  };

  const handleRetryLoad = () => {
    setRetryCount(prev => prev + 1);
    loadUserSubscription();
    toast({
      title: "Retrying",
      description: "Attempting to reload subscription data..."
    });
  };

  const renderContent = () => {
    if (isLoading || isSubscriptionLoading) {
      return (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (fetchError) {
      return (
        <Alert variant="destructive" className="my-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading subscription data</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>There was a problem loading your subscription information. This might be due to network issues or server problems.</p>
            <Button 
              variant="outline" 
              onClick={handleRetryLoad} 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        {subscription && (
          <SubscriptionDetails
            subscription={subscription}
            stripeSubscription={stripeSubscription}
            cancelAtPeriodEnd={cancelAtPeriodEnd === true}
            currentUsage={currentUsage}
            isManagingSubscription={isManagingSubscription}
            isChangingSubscription={isChangingSubscription}
            manageSubscription={manageSubscription}
            changeSubscription={(planId, interval) => changeSubscription(planId, interval)}
            getTierName={getTierName}
            formatDate={formatDate}
            plans={plans}
            changeSubscriptionError={changeSubscriptionError}
            changeSubscriptionSuccess={changeSubscriptionSuccess ? "true" : ""}
          />
        )}
        
        <BillingIntervalSelector 
          billingInterval={billingInterval}
          setBillingInterval={setBillingInterval}
          monthlyPrice={avgMonthlyPrice}
          yearlyPrice={avgYearlyPrice}
        />
        
        <PlansList
          plans={visiblePlans}
          billingInterval={billingInterval}
          currentTier={subscription?.tier}
          isSubscribing={isSubscribing}
          onSubscribe={handleSubscribe}
          mode="new"
        />
      </>
    );
  };

  return (
    <SubscriptionPageWrapper>
      <SubscriptionHeader />

      {!isLoggedIn && (
        <div className="my-8 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <h3 className="text-xl font-semibold mb-2">Login Required</h3>
          <p className="mb-4">You need to be logged in to view and manage your subscription.</p>
          <Button variant="default" onClick={() => window.location.href = '/login'}>
            Login Now
          </Button>
        </div>
      )}

      {isLoggedIn && renderContent()}
    </SubscriptionPageWrapper>
  );
}
