
import React, { useState } from 'react';
import { formatDistance } from 'date-fns';
import { Loader2, CheckCircle, XCircle, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubscriptionTier } from '@/types/subscription';
import { UpgradeSubscriptionModal } from './UpgradeSubscriptionModal';

interface SubscriptionDetailsProps {
  subscription: any;
  stripeSubscription: any;
  cancelAtPeriodEnd: boolean;
  currentUsage: any;
  isManagingSubscription: boolean;
  isChangingSubscription: boolean;
  manageSubscription: (action: 'portal' | 'cancel' | 'reactivate') => Promise<void>;
  changeSubscription: (planId: string, interval: 'month' | 'year') => Promise<void>;
  getTierName: (tier: SubscriptionTier) => string;
  formatDate: (date?: string) => string;
  plans: any[];
  changeSubscriptionError: string;
  changeSubscriptionSuccess: string;
}

export function SubscriptionDetails({
  subscription,
  stripeSubscription,
  cancelAtPeriodEnd,
  currentUsage,
  isManagingSubscription,
  isChangingSubscription,
  manageSubscription,
  changeSubscription,
  getTierName,
  formatDate,
  plans,
  changeSubscriptionError,
  changeSubscriptionSuccess
}: SubscriptionDetailsProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  if (!subscription) return null;
  
  const getCurrentPlanMessage = () => {
    if (subscription.tier === 'free') {
      return (
        <div className="flex items-center space-x-2 text-muted-foreground">
          <span>You are currently on the Free plan</span>
        </div>
      );
    }
    
    let message = `Your ${getTierName(subscription.tier)} plan `;
    
    if (cancelAtPeriodEnd && stripeSubscription?.current_period_end) {
      const endDate = new Date(stripeSubscription.current_period_end * 1000);
      message += `will end on ${endDate.toLocaleDateString()}`;
      return (
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      );
    }
    
    if (stripeSubscription?.current_period_end) {
      const endDate = new Date(stripeSubscription.current_period_end * 1000);
      const timeUntil = formatDistance(endDate, new Date(), { addSuffix: true });
      const interval = stripeSubscription.plan.interval === 'month' ? 'monthly' : 'yearly';
      message += `renews ${timeUntil} (${interval})`;
    }
    
    return (
      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
    );
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Your Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </div>
            {subscription.tier !== 'enterprise' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="flex items-center gap-1"
              >
                <ArrowUpDown className="h-4 w-4" />
                Change Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Plan</h3>
              <p className="text-lg font-semibold">{getTierName(subscription.tier)}</p>
              {getCurrentPlanMessage()}
            </div>
            
            {subscription.tier === 'free' && currentUsage && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Usage This Month</h3>
                <p className="text-lg font-semibold">{currentUsage.count} / {currentUsage.limit} prompts</p>
                <div className="w-full bg-secondary/20 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (currentUsage.count / currentUsage.limit) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentUsage.remaining} prompts remaining this month
                </p>
              </div>
            )}
            
            {stripeSubscription && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Billing Period</h3>
                  <p>
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Method</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => manageSubscription('portal')}
                    disabled={isManagingSubscription}
                    className="mt-1"
                  >
                    {isManagingSubscription ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Manage Payment Method
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
        {subscription.tier !== 'free' && (
          <CardFooter className="flex justify-between">
            <div></div>
            {cancelAtPeriodEnd ? (
              <Button
                variant="outline"
                onClick={() => manageSubscription('reactivate')}
                disabled={isManagingSubscription}
              >
                {isManagingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resume Subscription
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => manageSubscription('cancel')}
                disabled={isManagingSubscription}
              >
                {isManagingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Subscription
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

      <UpgradeSubscriptionModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        plans={plans}
        currentTier={subscription.tier}
        onUpgrade={changeSubscription}
        isUpdating={isChangingSubscription}
        errorMessage={changeSubscriptionError}
        successMessage={changeSubscriptionSuccess}
      />
    </>
  );
}
