
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
    const tierTimer = logger.startTimer('fetch_tier_distribution');
    logger.info('Fetching tier distribution');
    const { data: tierDistribution, error: tierError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('tier, count(*)')
      .groupBy('tier');
    
    tierTimer();
    
    if (tierError) {
      logger.error("Error fetching tier distribution", tierError as Error, { 
        query: 'tier_distribution',
        sql: `SELECT tier, COUNT(*) FROM user_subscriptions GROUP BY tier`
      });
      throw new Error(`Error fetching tier distribution: ${tierError.message}`);
    }
    
    logger.info("Tier distribution fetched successfully", {
      tiers: tierDistribution?.length || 0,
      distribution: tierDistribution
    });
    
    // Fetch new subscriptions created in the date range
    const newSubTimer = logger.startTimer('fetch_new_subscriptions');
    logger.info('Fetching new subscriptions', { startDate: startDateStr, endDate: endDateStr });
    const { data: newSubscriptions, error: newSubError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: false });
    
    newSubTimer();
    
    if (newSubError) {
      logger.error("Error fetching new subscriptions", newSubError as Error, { 
        query: 'new_subscriptions',
        dateRange: { start: startDateStr, end: endDateStr },
        sql: `SELECT * FROM user_subscriptions WHERE created_at >= '${startDateStr}' AND created_at <= '${endDateStr}' ORDER BY created_at DESC`
      });
      throw new Error(`Error fetching new subscriptions: ${newSubError.message}`);
    }
    
    logger.info("New subscriptions fetched successfully", {
      count: newSubscriptions?.length || 0
    });
    
    // Fetch subscription changes (upgrades, downgrades, cancellations) in the date range
    const changesTimer = logger.startTimer('fetch_subscription_changes');
    logger.info('Fetching subscription changes');
    const { data: subscriptionChanges, error: changesError } = await supabaseAdmin
      .from('subscription_events')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .in('event_type', ['subscription_updated', 'subscription_canceled', 'subscription_reactivated'])
      .order('created_at', { ascending: false });
    
    changesTimer();
    
    if (changesError) {
      logger.error("Error fetching subscription changes", changesError as Error, { 
        query: 'subscription_changes',
        dateRange: { start: startDateStr, end: endDateStr }
      });
      throw new Error(`Error fetching subscription changes: ${changesError.message}`);
    }
    
    logger.info("Subscription changes fetched successfully", {
      count: subscriptionChanges?.length || 0,
      byType: subscriptionChanges?.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
    
    // Fetch payment failures in the date range
    const failuresTimer = logger.startTimer('fetch_payment_failures');
    logger.info('Fetching payment failures');
    const { data: paymentFailures, error: failuresError } = await supabaseAdmin
      .from('payment_failures')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: false });
    
    failuresTimer();
    
    if (failuresError) {
      logger.error("Error fetching payment failures", failuresError as Error, { 
        query: 'payment_failures',
        dateRange: { start: startDateStr, end: endDateStr }
      });
      throw new Error(`Error fetching payment failures: ${failuresError.message}`);
    }
    
    logger.info("Payment failures fetched successfully", {
      count: paymentFailures?.length || 0
    });
    
    // Fetch active subscriptions over time for trend analysis
    const activeTimer = logger.startTimer('fetch_active_subscriptions');
    logger.info('Fetching active subscriptions');
    const { data: activeSubscriptions, error: activeError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('created_at, tier, status')
      .or('status.eq.active,cancel_at_period_end.eq.false')
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: true });
    
    activeTimer();
    
    if (activeError) {
      logger.error("Error fetching active subscriptions", activeError as Error, { 
        query: 'active_subscriptions',
        dateRange: { end: endDateStr }
      });
      throw new Error(`Error fetching active subscriptions: ${activeError.message}`);
    }
    
    logger.info("Active subscriptions fetched successfully", {
      count: activeSubscriptions?.length || 0,
      byTier: activeSubscriptions?.reduce((acc, sub) => {
        acc[sub.tier] = (acc[sub.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
    
    logger.info('Successfully fetched all subscription data', {
      totalQueriesTime: 
        performance.now() - 
        (performance as any).timeOrigin || 0,
      dataPointsCount: {
        tierDistribution: tierDistribution?.length || 0,
        newSubscriptions: newSubscriptions?.length || 0,
        subscriptionChanges: subscriptionChanges?.length || 0,
        paymentFailures: paymentFailures?.length || 0,
        activeSubscriptions: activeSubscriptions?.length || 0
      }
    });
    
    return {
      tierDistribution: tierDistribution || [],
      newSubscriptions: newSubscriptions || [],
      subscriptionChanges: subscriptionChanges || [],
      paymentFailures: paymentFailures || [],
      activeSubscriptions: activeSubscriptions || []
    };
  } catch (error) {
    logger.error("Error in fetchSubscriptionData", error as Error, {
      startDate: startDateStr,
      endDate: endDateStr
    });
    throw error;
  }
}
