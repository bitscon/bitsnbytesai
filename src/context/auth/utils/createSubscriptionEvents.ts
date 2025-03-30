
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const logSubscriptionEvent = async (
  userId: string,
  eventType: string,
  oldTier?: string,
  newTier?: string,
  metadata?: any
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        old_tier: oldTier,
        new_tier: newTier,
        metadata
      });

    if (error) {
      console.error('Error logging subscription event:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error logging subscription event:', err);
    return { success: false, error: err };
  }
};

export const trackSubscriptionChange = async (
  user: User | null,
  oldTier: string,
  newTier: string,
  reason: string
): Promise<void> => {
  if (!user) return;
  
  await logSubscriptionEvent(
    user.id,
    'subscription_changed',
    oldTier,
    newTier,
    {
      reason,
      timestamp: new Date().toISOString()
    }
  );
  
  console.log(`User ${user.id} subscription changed from ${oldTier} to ${newTier} (${reason})`);
};

export const trackPaymentFailure = async (
  userId: string,
  subscriptionId: string | null,
  paymentIntentId: string | null,
  amount: number | null,
  currency: string | null,
  reason: string | null,
  metadata?: any
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('payment_failures')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        payment_intent_id: paymentIntentId,
        amount,
        currency,
        reason,
        metadata
      });

    if (error) {
      console.error('Error tracking payment failure:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error tracking payment failure:', err);
    return { success: false, error: err };
  }
};
