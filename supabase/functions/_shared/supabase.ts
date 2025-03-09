
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.26.0';
import { supabaseAdmin } from './supabase-admin.ts';

// Subscription insertion/update logic
export const upsertSubscription = async ({
  userId,
  tier,
  stripeCustomerId,
  stripeSubscriptionId,
  currentPeriodStart,
  currentPeriodEnd,
}: {
  userId: string;
  tier: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(
        {
          user_id: userId,
          tier: tier,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('Error upserting subscription:', error);
      throw error;
    }

    console.log(`Successfully upserted subscription for user ${userId}`);
    return data;
  } catch (error) {
    console.error(`Error in upsertSubscription for user ${userId}:`, error);
    throw error;
  }
};
