
import React, { useState } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Loader2 } from 'lucide-react';
import { SubscriptionHeader } from '@/components/subscription/SubscriptionHeader';
import { SubscriptionDetails } from '@/components/subscription/SubscriptionDetails';
import { BillingIntervalSelector } from '@/components/subscription/BillingIntervalSelector';
import { PlansList } from '@/components/subscription/PlansList';
import { SubscriptionPageWrapper } from '@/components/subscription/SubscriptionPageWrapper';

export default function Subscription() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  
  const {
    isLoading,
    subscription,
    plans,
    stripeSubscription,
    cancelAtPeriodEnd,
    currentUsage,
    isSubscribing,
    isManagingSubscription,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess,
    subscribe,
    manageSubscription,
    changeSubscription,
    getTierName,
    formatDate
  } = useSubscription();

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    const priceId = billingInterval === 'month' 
      ? plan.stripe_price_id_monthly 
      : plan.stripe_price_id_yearly;
    
    if (!priceId) {
      return;
    }
    
    await subscribe(priceId, billingInterval);
  };

  return (
    <SubscriptionPageWrapper>
      <SubscriptionHeader />

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {subscription && (
            <SubscriptionDetails
              subscription={subscription}
              stripeSubscription={stripeSubscription}
              cancelAtPeriodEnd={cancelAtPeriodEnd}
              currentUsage={currentUsage}
              isManagingSubscription={isManagingSubscription}
              isChangingSubscription={isChangingSubscription}
              manageSubscription={manageSubscription}
              changeSubscription={(planId, interval) => changeSubscription(planId, interval)}
              getTierName={getTierName}
              formatDate={formatDate}
              plans={plans}
              changeSubscriptionError={changeSubscriptionError}
              changeSubscriptionSuccess={changeSubscriptionSuccess}
            />
          )}
          
          <BillingIntervalSelector 
            onChange={(value) => setBillingInterval(value)} 
          />
          
          <PlansList
            plans={plans}
            billingInterval={billingInterval}
            currentTier={subscription?.tier}
            isSubscribing={isSubscribing}
            onSubscribe={handleSubscribe}
            mode="new"
          />
        </>
      )}
    </SubscriptionPageWrapper>
  );
}
