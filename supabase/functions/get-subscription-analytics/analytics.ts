
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

interface TierDistribution {
  tier: string;
  count: number;
}

interface NewSubscription {
  created_at: string;
  tier: string;
}

interface SubscriptionChange {
  event_type: string;
  created_at: string;
  old_tier: string;
  new_tier: string;
}

interface PaymentFailure {
  created_at: string;
  reason: string;
  resolved: boolean;
  user_id: string;
  amount: number;
  currency: string;
}

interface AnalyticsData {
  tierDistribution: TierDistribution[];
  newSubscriptions: NewSubscription[];
  subscriptionChanges: SubscriptionChange[];
  paymentFailures: PaymentFailure[];
  activeSubscriptions: TierDistribution[];
}

/**
 * Fetches all subscription-related data from database
 */
export async function fetchSubscriptionData(startDateStr: string, endDateStr: string): Promise<AnalyticsData> {
  // 1. Total subscriptions by tier
  const { data: tierDistribution, error: tierError } = await supabaseAdmin
    .from('user_subscriptions')
    .select('tier, count')
    .groupBy('tier')
    .order('tier');
  
  if (tierError) {
    console.error("Error fetching tier distribution:", tierError);
  }
  
  // 2. New subscriptions over time
  const { data: newSubscriptions, error: newSubError } = await supabaseAdmin
    .from('user_subscriptions')
    .select('created_at, tier')
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr)
    .order('created_at');
  
  if (newSubError) {
    console.error("Error fetching new subscriptions:", newSubError);
  }
  
  // 3. Subscription changes (upgrades/downgrades)
  const { data: recentChanges, error: changesError } = await supabaseAdmin
    .from('subscription_events')
    .select('event_type, created_at, old_tier, new_tier')
    .in('event_type', ['upgrade', 'downgrade', 'cancel'])
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr)
    .order('created_at', { ascending: false });
  
  // For demo purposes, generate some placeholder data if the subscription_events table doesn't exist
  let subscriptionChanges = recentChanges;
  if (changesError) {
    console.log("Subscription events table may not exist, using placeholder data");
    subscriptionChanges = getPlaceholderSubscriptionChanges();
  }
  
  // 4. Payment failures
  const { data: paymentFailures, error: failuresError } = await supabaseAdmin
    .from('payment_failures')
    .select('created_at, reason, resolved, user_id, amount, currency')
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr)
    .order('created_at', { ascending: false });
  
  // Generate placeholder data if table doesn't exist
  let failures = paymentFailures;
  if (failuresError) {
    console.log("Payment failures table may not exist, using placeholder data");
    failures = getPlaceholderPaymentFailures();
  }
  
  // 5. Current active subscriptions
  const { data: activeSubscriptions, error: activeError } = await supabaseAdmin
    .from('user_subscriptions')
    .select('tier, count')
    .neq('tier', 'free')
    .groupBy('tier');
  
  if (activeError) {
    console.error("Error fetching active subscriptions:", activeError);
  }
  
  return {
    tierDistribution: tierDistribution || getPlaceholderTierDistribution(),
    newSubscriptions: newSubscriptions || [],
    subscriptionChanges: subscriptionChanges || [],
    paymentFailures: failures || [],
    activeSubscriptions: activeSubscriptions || []
  };
}

/**
 * Get placeholder tier distribution data
 */
function getPlaceholderTierDistribution(): TierDistribution[] {
  return [
    { tier: 'free', count: 85 },
    { tier: 'pro', count: 32 },
    { tier: 'premium', count: 12 },
    { tier: 'enterprise', count: 3 }
  ];
}

/**
 * Get placeholder subscription changes data
 */
function getPlaceholderSubscriptionChanges(): SubscriptionChange[] {
  return [
    {
      event_type: 'upgrade',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      old_tier: 'free',
      new_tier: 'pro'
    },
    {
      event_type: 'upgrade',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      old_tier: 'pro',
      new_tier: 'premium'
    },
    {
      event_type: 'downgrade',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      old_tier: 'premium',
      new_tier: 'pro'
    }
  ];
}

/**
 * Get placeholder payment failures data
 */
function getPlaceholderPaymentFailures(): PaymentFailure[] {
  return [
    {
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Card declined',
      resolved: false,
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 2990,
      currency: 'usd'
    },
    {
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Insufficient funds',
      resolved: true,
      user_id: '223e4567-e89b-12d3-a456-426614174001',
      amount: 4990,
      currency: 'usd'
    }
  ];
}
