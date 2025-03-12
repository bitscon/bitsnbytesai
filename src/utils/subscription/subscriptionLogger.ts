
import { subscriptionLogger } from '../logging';
import { SubscriptionTier } from '@/types/subscription';

// Subscription event types
export enum SubscriptionEventType {
  CHECKOUT_INITIATED = 'checkout_initiated',
  CHECKOUT_COMPLETED = 'checkout_completed',
  CHECKOUT_ABANDONED = 'checkout_abandoned',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELED = 'subscription_canceled',
  SUBSCRIPTION_REACTIVATED = 'subscription_reactivated',
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDED = 'trial_ended',
  RENEWAL_SUCCEEDED = 'renewal_succeeded',
  RENEWAL_FAILED = 'renewal_failed',
  INVOICE_PAID = 'invoice_paid',
  INVOICE_FAILED = 'invoice_failed',
  ADMIN_MODIFIED = 'admin_modified'
}

interface BaseEventLogData {
  userId: string;
  eventType: SubscriptionEventType;
  timestamp: string;
}

interface CheckoutEventData extends BaseEventLogData {
  currentTier: SubscriptionTier;
  priceId?: string;
  interval?: 'month' | 'year';
  currency?: string;
  amount?: number;
}

interface SubscriptionChangeEventData extends BaseEventLogData {
  subscriptionId: string;
  fromTier: SubscriptionTier;
  toTier: SubscriptionTier;
  reason?: string;
  adminId?: string;
}

interface PaymentEventData extends BaseEventLogData {
  subscriptionId?: string;
  invoiceId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  errorMessage?: string;
}

// Helper for logging subscription events
class SubscriptionEventsLogger {
  // Checkout flow events
  public logCheckoutInitiated(
    userId: string,
    currentTier: SubscriptionTier,
    priceId: string,
    interval: 'month' | 'year'
  ): void {
    subscriptionLogger.info(
      `Checkout initiated by user ${userId}`,
      {
        eventType: SubscriptionEventType.CHECKOUT_INITIATED,
        userId,
        currentTier,
        priceId,
        interval,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'checkout']
    );
  }

  public logCheckoutCompleted(
    userId: string,
    currentTier: SubscriptionTier,
    priceId: string,
    interval: 'month' | 'year',
    amount: number,
    currency: string
  ): void {
    subscriptionLogger.info(
      `Checkout completed by user ${userId}`,
      {
        eventType: SubscriptionEventType.CHECKOUT_COMPLETED,
        userId,
        currentTier,
        priceId,
        interval,
        amount,
        currency,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'checkout', 'success']
    );
  }

  public logCheckoutAbandoned(
    userId: string,
    currentTier: SubscriptionTier
  ): void {
    subscriptionLogger.warn(
      `Checkout abandoned by user ${userId}`,
      {
        eventType: SubscriptionEventType.CHECKOUT_ABANDONED,
        userId,
        currentTier,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'checkout', 'abandoned']
    );
  }

  // Payment events
  public logPaymentSucceeded(
    userId: string,
    subscriptionId: string,
    amount: number,
    currency: string,
    invoiceId?: string,
    paymentMethod?: string
  ): void {
    subscriptionLogger.info(
      `Payment succeeded for subscription ${subscriptionId}`,
      {
        eventType: SubscriptionEventType.PAYMENT_SUCCEEDED,
        userId,
        subscriptionId,
        amount,
        currency,
        invoiceId,
        paymentMethod,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'payment', 'success']
    );
  }

  public logPaymentFailed(
    userId: string,
    subscriptionId: string,
    amount: number,
    currency: string,
    errorMessage: string,
    invoiceId?: string
  ): void {
    subscriptionLogger.error(
      `Payment failed for subscription ${subscriptionId}`,
      {
        eventType: SubscriptionEventType.PAYMENT_FAILED,
        userId,
        subscriptionId,
        amount,
        currency,
        invoiceId,
        errorMessage,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'payment', 'error']
    );
  }

  // Subscription lifecycle events
  public logSubscriptionCreated(
    userId: string,
    subscriptionId: string,
    tier: SubscriptionTier
  ): void {
    subscriptionLogger.info(
      `Subscription created for user ${userId}`,
      {
        eventType: SubscriptionEventType.SUBSCRIPTION_CREATED,
        userId,
        subscriptionId,
        tier,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'lifecycle']
    );
  }

  public logSubscriptionUpdated(
    userId: string,
    subscriptionId: string,
    fromTier: SubscriptionTier,
    toTier: SubscriptionTier,
    reason: string
  ): void {
    subscriptionLogger.info(
      `Subscription updated for user ${userId} from ${fromTier} to ${toTier}`,
      {
        eventType: SubscriptionEventType.SUBSCRIPTION_UPDATED,
        userId,
        subscriptionId,
        fromTier,
        toTier,
        reason,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'update']
    );
  }

  public logSubscriptionCanceled(
    userId: string,
    subscriptionId: string,
    tier: SubscriptionTier,
    immediate: boolean
  ): void {
    subscriptionLogger.info(
      `Subscription ${immediate ? 'immediately canceled' : 'scheduled for cancellation'} for user ${userId}`,
      {
        eventType: SubscriptionEventType.SUBSCRIPTION_CANCELED,
        userId,
        subscriptionId,
        tier,
        immediate,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'cancellation']
    );
  }

  public logSubscriptionReactivated(
    userId: string,
    subscriptionId: string,
    tier: SubscriptionTier
  ): void {
    subscriptionLogger.info(
      `Subscription reactivated for user ${userId}`,
      {
        eventType: SubscriptionEventType.SUBSCRIPTION_REACTIVATED,
        userId,
        subscriptionId,
        tier,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'reactivation']
    );
  }

  // Trial events
  public logTrialStarted(
    userId: string,
    subscriptionId: string,
    tier: SubscriptionTier,
    trialEndDate: string
  ): void {
    subscriptionLogger.info(
      `Trial started for user ${userId}`,
      {
        eventType: SubscriptionEventType.TRIAL_STARTED,
        userId,
        subscriptionId,
        tier,
        trialEndDate,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'trial']
    );
  }

  public logTrialEnded(
    userId: string,
    subscriptionId: string,
    tier: SubscriptionTier,
    converted: boolean
  ): void {
    subscriptionLogger.info(
      `Trial ended for user ${userId}, converted to paid: ${converted}`,
      {
        eventType: SubscriptionEventType.TRIAL_ENDED,
        userId,
        subscriptionId,
        tier,
        converted,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'trial']
    );
  }

  // Admin events
  public logAdminModified(
    userId: string,
    subscriptionId: string,
    fromTier: SubscriptionTier,
    toTier: SubscriptionTier,
    adminId: string,
    reason: string
  ): void {
    subscriptionLogger.warn(
      `Subscription for user ${userId} modified by admin ${adminId}`,
      {
        eventType: SubscriptionEventType.ADMIN_MODIFIED,
        userId,
        subscriptionId,
        fromTier,
        toTier,
        adminId,
        reason,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'admin', 'modification']
    );
  }

  // Renewal events
  public logRenewalSucceeded(
    userId: string,
    subscriptionId: string,
    tier: SubscriptionTier,
    amount: number,
    currency: string,
    nextRenewalDate: string
  ): void {
    subscriptionLogger.info(
      `Subscription renewed for user ${userId}`,
      {
        eventType: SubscriptionEventType.RENEWAL_SUCCEEDED,
        userId,
        subscriptionId,
        tier,
        amount,
        currency,
        nextRenewalDate,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'renewal', 'success']
    );
  }

  public logRenewalFailed(
    userId: string,
    subscriptionId: string,
    tier: SubscriptionTier,
    amount: number,
    currency: string,
    errorMessage: string
  ): void {
    subscriptionLogger.error(
      `Subscription renewal failed for user ${userId}`,
      {
        eventType: SubscriptionEventType.RENEWAL_FAILED,
        userId,
        subscriptionId,
        tier,
        amount,
        currency,
        errorMessage,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'renewal', 'error']
    );
  }

  // Invoice events
  public logInvoicePaid(
    userId: string,
    subscriptionId: string,
    invoiceId: string,
    amount: number,
    currency: string
  ): void {
    subscriptionLogger.info(
      `Invoice paid for subscription ${subscriptionId}`,
      {
        eventType: SubscriptionEventType.INVOICE_PAID,
        userId,
        subscriptionId,
        invoiceId,
        amount,
        currency,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'invoice', 'payment']
    );
  }

  public logInvoiceFailed(
    userId: string,
    subscriptionId: string,
    invoiceId: string,
    amount: number,
    currency: string,
    errorMessage: string
  ): void {
    subscriptionLogger.error(
      `Invoice payment failed for subscription ${subscriptionId}`,
      {
        eventType: SubscriptionEventType.INVOICE_FAILED,
        userId,
        subscriptionId,
        invoiceId,
        amount,
        currency,
        errorMessage,
        timestamp: new Date().toISOString()
      },
      undefined,
      ['subscription', 'invoice', 'error']
    );
  }
}

export const subscriptionEvents = new SubscriptionEventsLogger();
