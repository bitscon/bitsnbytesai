
import { createLogger } from "../_shared/logging.ts";

/**
 * Processes raw subscription data into formatted response
 */
export function createResponse(data: any) {
  const logger = createLogger('createResponse');
  logger.info('Processing subscription data for response');
  
  try {
    const {
      tierDistribution,
      newSubscriptions,
      subscriptionChanges,
      paymentFailures,
      activeSubscriptions
    } = data;

    // Process tier distribution
    logger.debug('Processing tier distribution data');
    const tierData = tierDistribution.map((item: any) => ({
      tier: item.tier,
      count: parseInt(item.count) // Ensure count is a number
    }));

    // Calculate total subscribers
    const totalSubscribers = tierData.reduce((sum: number, item: any) => sum + item.count, 0);
    logger.info(`Total subscribers: ${totalSubscribers}`);

    // Count new subscribers in the date range
    const newSubCount = newSubscriptions.length;
    logger.info(`New subscribers in date range: ${newSubCount}`);

    // Count cancellations
    const cancellations = subscriptionChanges.filter((event: any) => 
      event.event_type === 'subscription_canceled'
    ).length;
    logger.info(`Cancellations in date range: ${cancellations}`);

    // Calculate churn rate as a string percentage
    let churnRate = "0%";
    if (totalSubscribers > 0) {
      churnRate = ((cancellations / totalSubscribers) * 100).toFixed(2) + "%";
    }
    logger.info(`Calculated churn rate: ${churnRate}`);

    // Count upgrades and downgrades
    const upgrades = subscriptionChanges.filter((event: any) => 
      event.event_type === 'subscription_updated' && event.metadata?.upgrade === true
    ).length;
    
    const downgrades = subscriptionChanges.filter((event: any) => 
      event.event_type === 'subscription_updated' && event.metadata?.downgrade === true
    ).length;
    
    logger.info(`Upgrades: ${upgrades}, Downgrades: ${downgrades}`);

    // Calculate revenue metrics (placeholder - would need real revenue data)
    // For now, just count premium subscribers for MRR estimate
    const premiumSubscribers = tierData.find((item: any) => item.tier === 'premium')?.count || 0;
    const proSubscribers = tierData.find((item: any) => item.tier === 'pro')?.count || 0;
    
    // Simplified MRR calculation ($15/mo for Pro, $29/mo for Premium)
    const estimatedMRR = (proSubscribers * 15) + (premiumSubscribers * 29);
    logger.info(`Estimated MRR: $${estimatedMRR}`);

    // Calculate payment failure rate
    let paymentFailureRate = "0%";
    const totalPaymentAttempts = paymentFailures.length + newSubscriptions.length; // Simplified
    
    if (totalPaymentAttempts > 0) {
      paymentFailureRate = 
        ((paymentFailures.length / totalPaymentAttempts) * 100).toFixed(2) + "%";
    }
    logger.info(`Payment failure rate: ${paymentFailureRate}`);

    // Calculate conversion rate from trial to paid (placeholder - needs real conversion data)
    const conversionRate = "45.2%"; // Example value - would need real conversion data
    logger.info(`Conversion rate: ${conversionRate}`);

    // Process all data into a structured response
    const response = {
      metrics: {
        totalSubscribers,
        newSubscribers: newSubCount,
        churnRate,
        upgrades,
        downgrades,
        estimatedMRR: `$${estimatedMRR}`,
        paymentFailureRate,
        conversionRate
      },
      charts: {
        tierDistribution: tierData,
        // Additional charts could be added here
      },
      tables: {
        recentSubscriptions: newSubscriptions.map((sub: any) => ({
          id: sub.id,
          userId: sub.user_id,
          tier: sub.tier,
          createdAt: sub.created_at,
          status: sub.status
        })).slice(0, 10),
        recentCancellations: subscriptionChanges
          .filter((event: any) => event.event_type === 'subscription_canceled')
          .map((event: any) => ({
            id: event.id,
            userId: event.user_id,
            tier: event.old_tier,
            date: event.created_at,
            metadata: event.metadata
          })).slice(0, 10),
        paymentFailures: paymentFailures.map((failure: any) => ({
          id: failure.id,
          userId: failure.user_id,
          date: failure.created_at,
          reason: failure.reason || 'Unknown',
          amount: failure.amount
        })).slice(0, 10)
      }
    };

    logger.info('Response processed successfully', { 
      responseSize: JSON.stringify(response).length
    });
    
    return response;
  } catch (error) {
    logger.error('Error processing subscription analytics response', error as Error);
    throw error;
  }
}
