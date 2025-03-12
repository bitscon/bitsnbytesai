import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { createLogger } from "../_shared/logging.ts";

/**
 * Fetches all subscription-related data needed for analytics
 */
export async function fetchSubscriptionData(startDateStr: string, endDateStr: string) {
  const logger = createLogger('fetchSubscriptionData');
  logger.info(`Fetching subscription data`, { startDate: startDateStr, endDate: endDateStr });
  
  try {
    // Fetch current subscription tier distribution
    logger.info('Fetching tier distribution');
    const { data: tierDistribution, error: tierError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('tier, count(*)')
      .groupBy('tier');
    
    if (tierError) {
      logger.error("Error fetching tier distribution", tierError as Error, { query: 'tier_distribution' });
      throw new Error(`Error fetching tier distribution: ${tierError.message}`);
    }
    
    // Fetch new subscriptions created in the date range
    logger.info('Fetching new subscriptions');
    const { data: newSubscriptions, error: newSubError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: false });
    
    if (newSubError) {
      logger.error("Error fetching new subscriptions", newSubError as Error, { 
        query: 'new_subscriptions',
        dateRange: { start: startDateStr, end: endDateStr }
      });
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
      logger.error("Error fetching subscription changes", changesError as Error, { query: 'subscription_changes' });
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
      logger.error("Error fetching payment failures", failuresError as Error, { query: 'payment_failures' });
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
      logger.error("Error fetching active subscriptions", activeError as Error, { query: 'active_subscriptions' });
      throw new Error(`Error fetching active subscriptions: ${activeError.message}`);
    }
    
    logger.info('Successfully fetched all subscription data');
    
    return {
      tierDistribution: tierDistribution || [],
      newSubscriptions: newSubscriptions || [],
      subscriptionChanges: subscriptionChanges || [],
      paymentFailures: paymentFailures || [],
      activeSubscriptions: activeSubscriptions || []
    };
  } catch (error) {
    logger.error("Error in fetchSubscriptionData", error as Error);
    throw error;
  }
}
