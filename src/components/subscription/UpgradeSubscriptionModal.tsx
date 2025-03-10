
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlansList } from './PlansList';
import { SubscriptionPlan, SubscriptionTier } from '@/types/subscription';
import { BillingIntervalSelector } from './BillingIntervalSelector';

interface UpgradeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  currentTier: SubscriptionTier;
  onUpgrade: (planId: string, interval: 'month' | 'year') => Promise<void>;
  isUpdating: boolean;
  errorMessage: string;
  successMessage: string;
}

export function UpgradeSubscriptionModal({
  isOpen,
  onClose,
  plans,
  currentTier,
  onUpgrade,
  isUpdating,
  errorMessage,
  successMessage
}: UpgradeSubscriptionModalProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    setSelectedPlan(plan);
    setShowConfirmation(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;
    
    await onUpgrade(selectedPlan.id, billingInterval);
    if (!errorMessage) {
      // If no error, reset state after successful upgrade
      setShowConfirmation(false);
      setSelectedPlan(null);
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setSelectedPlan(null);
    onClose();
  };

  const getTierAction = (planTier: SubscriptionTier, currentTier: SubscriptionTier) => {
    const tierLevels: Record<SubscriptionTier, number> = {
      'free': 0,
      'pro': 1,
      'premium': 2,
      'enterprise': 3
    };

    if (tierLevels[planTier] > tierLevels[currentTier]) {
      return 'Upgrade to';
    } else if (tierLevels[planTier] < tierLevels[currentTier]) {
      return 'Downgrade to';
    } else {
      return 'Switch to';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Subscription</DialogTitle>
          <DialogDescription>
            Select a new subscription plan. Your billing will be adjusted according to the new plan.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="default" className="my-4 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {!showConfirmation ? (
          <>
            <BillingIntervalSelector 
              billingInterval={billingInterval}
              setBillingInterval={setBillingInterval}
            />
            
            <div className="py-4">
              <PlansList
                plans={plans}
                billingInterval={billingInterval}
                currentTier={currentTier}
                isSubscribing={isUpdating}
                onSubscribe={handlePlanSelect}
                mode="change"
              />
            </div>
          </>
        ) : (
          <>
            <div className="py-6 space-y-4">
              <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Confirm subscription change</AlertTitle>
                <AlertDescription>
                  You are about to {getTierAction(selectedPlan?.tier as SubscriptionTier, currentTier).toLowerCase()} the {selectedPlan?.name} plan 
                  with {billingInterval === 'month' ? 'monthly' : 'yearly'} billing.
                  {billingInterval === 'month' 
                    ? ` Your card will be charged $${selectedPlan?.price_monthly.toFixed(2)} per month.` 
                    : ` Your card will be charged $${selectedPlan?.price_yearly.toFixed(2)} per year.`}
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-gray-500">
                Your subscription will be updated immediately. Stripe will calculate any proration 
                adjustments automatically based on the remaining time in your current billing period.
              </p>
            </div>
            
            <DialogFooter className="flex space-x-2 sm:space-x-0">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isUpdating}
              >
                Back to plans
              </Button>
              <Button
                onClick={handleConfirmUpgrade}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Confirm ${getTierAction(selectedPlan?.tier as SubscriptionTier, currentTier)}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
