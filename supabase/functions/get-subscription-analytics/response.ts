
interface AnalyticsData {
  tierDistribution: any[];
  newSubscriptions: any[];
  subscriptionChanges: any[];
  paymentFailures: any[];
  activeSubscriptions: any[];
}

interface AnalyticsResponse {
  tierDistribution: any[];
  newSubscriptions: any[];
  subscriptionChanges: any[];
  paymentFailures: any[];
  activeSubscriptions: any[];
  period: {
    start: string;
    end: string;
  };
  metrics: {
    total_subscribers: number;
    paid_subscribers: number;
    conversion_rate: string;
    payment_failures: number;
  };
}

/**
 * Formats the analytics data for response
 */
export function formatResponse(
  data: AnalyticsData, 
  startDateStr: string, 
  endDateStr: string
): AnalyticsResponse {
  // Calculate summary metrics for the dashboard
  const totalSubscribers = (data.tierDistribution || []).reduce(
    (total, item) => total + Number(item.count), 0) || 0;
  
  const paidSubscribers = (data.tierDistribution || []).reduce(
    (total, item) => item.tier !== 'free' ? total + Number(item.count) : total, 0) || 0;
  
  const conversionRate = totalSubscribers > 0 
    ? ((paidSubscribers / totalSubscribers) * 100).toFixed(1) 
    : '0';
  
  const paymentFailures = (data.paymentFailures || []).length;
  
  return {
    tierDistribution: data.tierDistribution,
    newSubscriptions: data.newSubscriptions,
    subscriptionChanges: data.subscriptionChanges,
    paymentFailures: data.paymentFailures,
    activeSubscriptions: data.activeSubscriptions,
    period: {
      start: startDateStr,
      end: endDateStr
    },
    metrics: {
      total_subscribers: totalSubscribers,
      paid_subscribers: paidSubscribers,
      conversion_rate: conversionRate,
      payment_failures: paymentFailures
    }
  };
}
