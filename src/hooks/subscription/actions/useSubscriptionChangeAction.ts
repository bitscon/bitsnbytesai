
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/subscription';
import { supabase } from '@/integrations/supabase/client';
import { changeStripeSubscription } from '@/utils/subscription/stripeUtils';

interface UseSubscriptionChangeActionProps {
  userId?: string;
  stripeSubscriptionId?: string;
  loadUserSubscription: () => Promise<void>;
}

/**
 * Hook for handling subscription plan changes
 */
export function useSubscriptionChangeAction({
  userId,
  stripeSubscriptionId,
  loadUserSubscription
}: UseSubscriptionChangeActionProps) {
  const { toast } = useToast();
  const [isChangingSubscription, setIsChangingSubscription] = useState(false);
  const [changeSubscriptionError, setChangeSubscriptionError] = useState('');
  const [changeSubscriptionSuccess, setChangeSubscriptionSuccess] = useState('');

  // Helper function to get plan by ID
  const getPlanById = async (planId: string): Promise<SubscriptionPlan | null> => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();
        
      if (!data) return null;
      
      // Transform the features from Json to the expected SubscriptionPlan format
      const transformedPlan: SubscriptionPlan = {
        ...data,
        features: typeof data.features === 'string' 
          ? JSON.parse(data.features) 
          : data.features as { [key: string]: any; description: string; }
      };
      
      return transformedPlan;
    } catch (error) {
      console.error('Error fetching plan details:', error);
      return null;
    }
  };

  /**
   * Changes an existing subscription to a new plan
   */
  const changeSubscription = useCallback(async (planId: string, interval: 'month' | 'year'): Promise<void> => {
    if (!userId || !stripeSubscriptionId) {
      setChangeSubscriptionError('You must have an active subscription to change plans.');
      return;
    }
    
    try {
      setIsChangingSubscription(true);
      setChangeSubscriptionError('');
      setChangeSubscriptionSuccess('');
      
      // Find the plan and get the price ID
      const plan = await getPlanById(planId);
      if (!plan) {
        setChangeSubscriptionError('Selected plan not found.');
        return;
      }
      
      const priceId = interval === 'month' 
        ? plan.stripe_price_id_monthly 
        : plan.stripe_price_id_yearly;
        
      if (!priceId) {
        setChangeSubscriptionError(`No ${interval}ly price available for selected plan.`);
        return;
      }
      
      // Call the API to update the subscription
      const result = await changeStripeSubscription(
        stripeSubscriptionId,
        userId,
        priceId,
        interval
      );
      
      if (!result.success) {
        console.error('Error updating subscription:', result.message);
        setChangeSubscriptionError(result.message || 'Failed to update subscription. Please try again.');
        return;
      }
      
      // Update successful
      setChangeSubscriptionSuccess(`Your subscription has been updated to the ${plan.name} plan.`);
      toast({
        title: 'Subscription Updated',
        description: `Your subscription has been changed to the ${plan.name} plan.`,
      });
      
      // Refresh subscription data
      await loadUserSubscription();
      
    } catch (error: any) {
      console.error('Error in changeSubscription:', error);
      setChangeSubscriptionError('An unexpected error occurred. Please try again.');
    } finally {
      setIsChangingSubscription(false);
    }
  }, [userId, stripeSubscriptionId, toast, loadUserSubscription]);

  return {
    changeSubscription,
    isChangingSubscription,
    changeSubscriptionError,
    changeSubscriptionSuccess
  };
}
