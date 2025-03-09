
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserNavbar } from '@/components/UserNavbar';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/context/auth';
import { Loader2 } from 'lucide-react';
import { SubscriptionHeader } from '@/components/subscription/SubscriptionHeader';
import { SubscriptionDetails } from '@/components/subscription/SubscriptionDetails';
import { BillingIntervalSelector } from '@/components/subscription/BillingIntervalSelector';
import { PlansList } from '@/components/subscription/PlansList';

export default function Subscription() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
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
    subscribe,
    manageSubscription,
    getTierName,
    formatDate
  } = useSubscription();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar hasPurchased={false} />
        <div className="container mx-auto px-4 pt-24 pb-16 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

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
    <div className="min-h-screen bg-background">
      <UserNavbar hasPurchased={subscription?.tier !== 'free'} />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
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
                  manageSubscription={manageSubscription}
                  getTierName={getTierName}
                  formatDate={formatDate}
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
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
