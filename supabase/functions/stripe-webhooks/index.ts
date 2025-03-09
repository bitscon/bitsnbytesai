import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno'
import { upsertSubscription } from '../_shared/supabase.ts'
import { getApiSetting } from "../_shared/api-settings.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      console.error("Stripe secret key not found");
      return new Response(
        JSON.stringify({ error: "Stripe secret key not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()

    let event
    try {
      const webhookSecret = await getApiSetting("STRIPE_WEBHOOK_SECRET");

      if (!webhookSecret) {
        console.error("Stripe webhook secret not found");
        return new Response(
          JSON.stringify({ error: "Stripe webhook secret not found" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(err.message, { status: 400 })
    }

    await handleEvent(event);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

const handleEvent = async (event: any) => {
  const { type, data } = event;
  console.log(`Processing webhook event: ${type}`);

  // Extract user_id from metadata or customer object
  const userId = await getUserIdFromEvent(event);
  
  try {
    switch (type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(data.object, userId);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data.object, userId);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data.object, userId);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(data.object, userId);
        break;
        
      // Add new case for payment_intent failure
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(data.object, userId);
        break;
        
      default:
        console.log(`Unhandled event type ${type}`)
    }
    
  } catch (error) {
    console.error('Error handling webhook event:', error);
  }
};

const getUserIdFromEvent = async (event: any): Promise<string | null> => {
  let userId = null;

  if (event.data.object.metadata?.user_id) {
    // Extract user_id from metadata
    userId = event.data.object.metadata.user_id;
  } else if (event.data.object.customer) {
    // If user_id is not in metadata, try to get it from the customer object
    const customerId = event.data.object.customer;

    // Retrieve the customer object from Stripe
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      console.error("Stripe secret key not found");
      return null;
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.metadata?.user_id) {
        userId = customer.metadata.user_id;
      }
    } catch (error) {
      console.error('Error retrieving customer:', error);
    }
  }

  return userId;
};

const handleSubscriptionCreated = async (subscription: any, userId: string | null) => {
  if (!userId) {
    console.log('No user found for subscription creation');
    return;
  }

  const tier = determineTierFromStripePriceId(subscription.items.data[0].price.id);

  await upsertSubscription({
    userId: userId,
    tier: tier,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  })
}

// Enhanced version that logs the change to subscription_events
const handleSubscriptionUpdated = async (subscription: any, userId: string | null) => {
  if (!userId) {
    console.log('No user found for subscription update');
    return;
  }
  
  // Get existing subscription
  const { data: existingSubscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();
  
  if (existingSubscription) {
    // Determine if this is an upgrade, downgrade, or cancellation
    let eventType = 'update';
    let oldTier = existingSubscription.tier;
    let newTier = await determineTierFromStripePriceId(subscription.items.data[0].price.id);
    
    if (oldTier !== newTier) {
      if (tierLevels[oldTier] < tierLevels[newTier]) {
        eventType = 'upgrade';
      } else if (tierLevels[oldTier] > tierLevels[newTier]) {
        eventType = 'downgrade';
      }
      
      // Log the subscription change event
      await supabaseAdmin.from('subscription_events').insert({
        user_id: userId,
        event_type: eventType,
        old_tier: oldTier,
        new_tier: newTier,
        metadata: {
          subscription_id: subscription.id,
          cancel_at_period_end: subscription.cancel_at_period_end
        }
      });
    }
    
    // If the subscription is set to cancel at period end and it wasn't before
    if (subscription.cancel_at_period_end && !existingSubscription.cancel_at_period_end) {
      await supabaseAdmin.from('subscription_events').insert({
        user_id: userId,
        event_type: 'cancel_scheduled',
        old_tier: oldTier,
        new_tier: oldTier, // Same tier, just scheduled to cancel
        metadata: {
          subscription_id: subscription.id,
          cancel_at: subscription.cancel_at
        }
      });
    }
    
    // Update subscription in database
    await upsertSubscription({
      userId: userId,
      tier: newTier,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  }
};

// Enhanced version that logs the deletion to subscription_events
const handleSubscriptionDeleted = async (subscription: any, userId: string | null) => {
  if (!userId) {
    console.log('No user found for subscription deletion');
    return;
  }
  
  // Get existing subscription
  const { data: existingSubscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();
  
  if (existingSubscription) {
    // Log the cancellation event
    await supabaseAdmin.from('subscription_events').insert({
      user_id: userId,
      event_type: 'cancel',
      old_tier: existingSubscription.tier,
      new_tier: 'free',
      metadata: {
        subscription_id: subscription.id,
        reason: 'subscription_deleted'
      }
    });
    
    // Update subscription in database
    await supabaseAdmin
      .from('user_subscriptions')
      .delete()
      .eq('stripe_subscription_id', subscription.id);
  }
};

// Enhanced version that logs payment failures
const handlePaymentFailed = async (invoice: any, userId: string | null) => {
  if (!userId) {
    console.log('No user found for payment failure');
    return;
  }
  
  console.log(`Payment failed for invoice ${invoice.id}, user ${userId}`);
  
  // Log the payment failure
  await supabaseAdmin.from('payment_failures').insert({
    user_id: userId,
    subscription_id: invoice.subscription,
    payment_intent_id: invoice.payment_intent,
    amount: invoice.amount_due / 100, // Convert from cents
    currency: invoice.currency,
    reason: invoice.last_payment_error?.message || 'Unknown reason',
    metadata: {
      invoice_id: invoice.id,
      attempt_count: invoice.attempt_count,
      next_payment_attempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null
    }
  });
  
  // Send email notification, etc.
};

// New handler for payment_intent.payment_failed events
const handlePaymentIntentFailed = async (paymentIntent: any, userId: string | null) => {
  if (!userId) {
    // Try to find the user from the payment intent metadata
    if (paymentIntent.metadata?.user_id) {
      userId = paymentIntent.metadata.user_id;
    } else {
      console.log('No user found for payment intent failure');
      return;
    }
  }
  
  console.log(`Payment intent failed: ${paymentIntent.id}, user ${userId}`);
  
  // Log the payment failure
  await supabaseAdmin.from('payment_failures').insert({
    user_id: userId,
    subscription_id: paymentIntent.metadata?.subscription_id,
    payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount / 100, // Convert from cents
    currency: paymentIntent.currency,
    reason: paymentIntent.last_payment_error?.message || 'Unknown reason',
    metadata: {
      error_code: paymentIntent.last_payment_error?.code,
      payment_method: paymentIntent.last_payment_error?.payment_method?.type,
      decline_code: paymentIntent.last_payment_error?.decline_code
    }
  });
  
  // Send email notification, etc.
};

// Helper function to determine tier from Stripe Price ID
const tierLevels: Record<string, number> = {
  'free': 0,
  'pro': 1,
  'premium': 2,
  'enterprise': 3
};

const determineTierFromStripePriceId = async (priceId: string) => {
  // Query our subscription_plans table to find the tier for this price ID
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .select('tier')
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
    .single();
  
  if (error || !data) {
    console.error('Error determining tier from price ID:', error);
    return 'free'; // Default to free tier if we can't determine
  }
  
  return data.tier;
};

serve(handler)
