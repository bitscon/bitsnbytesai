
import { appLogger } from '@/utils/logging';
import { SubscriptionTier } from '@/types/subscription';

const subscriptionLogger = appLogger.child({ component: 'Subscription' });

/**
 * Logger for subscription-related events
 */
export const subscriptionEvents = {
  /**
   * Log checkout initiated
   */
  logCheckoutInitiated: (userId: string, planId: string, priceId: string, interval: 'month' | 'year') => {
    subscriptionLogger.info('Subscription checkout initiated', {
      userId,
      planId,
      priceId,
      interval,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log checkout session created
   */
  logCheckoutSessionCreated: (userId: string, sessionId: string, customerId: string) => {
    subscriptionLogger.info('Checkout session created', {
      userId,
      sessionId,
      customerId,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log checkout completed
   */
  logCheckoutCompleted: (userId: string, sessionId: string, tier: SubscriptionTier) => {
    subscriptionLogger.info('Checkout completed successfully', {
      userId,
      sessionId,
      tier,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log checkout abandoned
   */
  logCheckoutAbandoned: (userId: string, sessionId: string) => {
    subscriptionLogger.info('Checkout abandoned', {
      userId,
      sessionId,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log subscription created
   */
  logSubscriptionCreated: (userId: string, subscriptionId: string, tier: SubscriptionTier) => {
    subscriptionLogger.info('Subscription created', {
      userId,
      subscriptionId,
      tier,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log subscription updated
   */
  logSubscriptionUpdated: (
    userId: string, 
    subscriptionId: string, 
    oldTier: SubscriptionTier, 
    newTier: SubscriptionTier,
    updateType: 'upgrade' | 'downgrade' | 'renewal' | 'other'
  ) => {
    subscriptionLogger.info(`Subscription ${updateType}`, {
      userId,
      subscriptionId,
      oldTier,
      newTier,
      updateType,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log subscription canceled
   */
  logSubscriptionCanceled: (userId: string, subscriptionId: string, tier: SubscriptionTier, immediate: boolean) => {
    subscriptionLogger.info(`Subscription ${immediate ? 'terminated' : 'scheduled for cancellation'}`, {
      userId,
      subscriptionId,
      tier,
      immediate,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log subscription reactivated
   */
  logSubscriptionReactivated: (userId: string, subscriptionId: string, tier: SubscriptionTier) => {
    subscriptionLogger.info('Subscription reactivated', {
      userId,
      subscriptionId,
      tier,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log payment success
   */
  logPaymentSuccess: (userId: string, subscriptionId: string, amount: number, provider: 'stripe' | 'paypal') => {
    subscriptionLogger.info('Payment successful', {
      userId,
      subscriptionId,
      amount,
      provider,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log payment failure
   */
  logPaymentFailure: (userId: string, subscriptionId: string, error: string, provider: 'stripe' | 'paypal') => {
    subscriptionLogger.error('Payment failed', new Error(error), {
      userId,
      subscriptionId,
      provider,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log manual subscription override by admin
   */
  logManualSubscriptionOverride: (
    userId: string, 
    adminId: string, 
    tier: SubscriptionTier, 
    action: 'create' | 'update' | 'delete'
  ) => {
    subscriptionLogger.info('Manual subscription override', {
      userId,
      adminId,
      tier,
      action,
      timestamp: new Date().toISOString()
    });
  }
};
