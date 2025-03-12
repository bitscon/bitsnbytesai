
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

/**
 * Fetches all subscription-related data needed for analytics
 */
export async function fetchSubscriptionData(startDateStr: string, endDateStr: string) {
  console.log(`Fetching subscription data from ${startDateStr} to ${endDateStr}`);
  
  try {
    // Fetch current subscription tier distribution
    const { data: tierDistribution, error: tierError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('tier, count(*)')
      .groupBy('tier');
    
    if (tierError) {
      console.error("Error fetching tier distribution:", tierError);
      throw new Error(`Error fetching tier distribution: ${tierError.message}`);
    }
    
    // Fetch new subscriptions created in the date range
    const { data: newSubscriptions, error: newSubError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: false });
    
    if (newSubError) {
      console.error("Error fetching new subscriptions:", newSubError);
      throw new Error(`Error fetching new subscriptions: ${newSubError.message}`);
    }
    
    // Fetch subscription changes (upgrades, downgrades, cancellations) in the date range
    const { data: subscriptionChanges, error: changesError } = await supabaseAdmin
      .from('subscription_events')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .in('event_type', ['subscription_updated', 'subscription_canceled', 'subscription_reactivated'])
      .order('created_at', { ascending: false });
    
    if (changesError) {
      console.error("Error fetching subscription changes:", changesError);
      throw new Error(`Error fetching subscription changes: ${changesError.message}`);
    }
    
    // Fetch payment failures in the date range
    const { data: paymentFailures, error: failuresError } = await supabaseAdmin
      .from('payment_failures')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: false });
    
    if (failuresError) {
      console.error("Error fetching payment failures:", failuresError);
      throw new Error(`Error fetching payment failures: ${failuresError.message}`);
    }
    
    // Fetch active subscriptions over time for trend analysis
    const { data: activeSubscriptions, error: activeError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('created_at, tier, status')
      .or('status.eq.active,cancel_at_period_end.eq.false')
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: true });
    
    if (activeError) {
      console.error("Error fetching active subscriptions:", activeError);
      throw new Error(`Error fetching active subscriptions: ${activeError.message}`);
    }
    
    return {
      tierDistribution: tierDistribution || [],
      newSubscriptions: newSubscriptions || [],
      subscriptionChanges: subscriptionChanges || [],
      paymentFailures: paymentFailures || [],
      activeSubscriptions: activeSubscriptions || []
    };
  } catch (error) {
    console.error("Error in fetchSubscriptionData:", error);
    throw error;
  }
}
