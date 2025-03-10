
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get the request body as text
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the Stripe secret keys
    const stripeWebhookSecret = await getApiSetting("STRIPE_WEBHOOK_SECRET");
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    
    if (!stripeWebhookSecret || !stripeSecretKey) {
      console.error("Missing Stripe configuration");
      return new Response(JSON.stringify({ error: "Stripe not configured properly" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Event received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // When a checkout is completed, update the subscription in our database
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // When a subscription is updated, update it in our database
        await handleSubscriptionUpdated(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // When a subscription is deleted, update it in our database
        await handleSubscriptionDeleted(subscription);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        // When an invoice payment fails, record the failure
        await handlePaymentFailed(invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(JSON.stringify({ error: `Webhook Error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

// Handler for checkout.session.completed event
async function handleCheckoutCompleted(session: any) {
  try {
    // Get the user ID and subscription details from the session metadata
    const userId = session.metadata?.user_id;
    const subscriptionId = session.subscription;
    
    if (!userId || !subscriptionId) {
      console.error('Missing user_id or subscription in session metadata');
      return;
    }
    
    console.log(`Processing completed checkout for user ${userId}, subscription ${subscriptionId}`);
    
    // Update the subscription in our database - this is handled by the verify-subscription function
    // when the user is redirected to the success page, but we handle it here as a backup
    // in case the user doesn't return to our site
    
    // Record the event
    await supabaseAdmin
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'checkout_completed',
        metadata: {
          session_id: session.id,
          subscription_id: subscriptionId,
          amount_total: session.amount_total / 100,
          currency: session.currency,
          payment_status: session.payment_status,
        }
      });
      
    console.log(`Recorded checkout.session.completed event for user ${userId}`);
      
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

// Handler for customer.subscription.updated event
async function handleSubscriptionUpdated(subscription: any) {
  try {
    // Get the subscription details
    const stripeSubscriptionId = subscription.id;
    const status = subscription.status;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    // Get the price and product info to determine subscription tier
    const priceId = subscription.items.data[0].price.id;
    
    // Find the user subscription in our database
    const { data: userSubscription, error: findError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, tier')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();
      
    if (findError || !userSubscription) {
      console.error(`Error finding subscription ${stripeSubscriptionId}:`, findError || 'Not found');
      return;
    }
    
    const userId = userSubscription.user_id;
    const oldTier = userSubscription.tier;
    
    // Get the plan associated with the price ID
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('tier')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .maybeSingle();
      
    if (planError || !plan) {
      console.error(`Error finding plan for price ${priceId}:`, planError || 'Not found');
      return;
    }
    
    const newTier = plan.tier;
    
    // Update the subscription in our database
    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        tier: newTier,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);
      
    if (updateError) {
      console.error(`Error updating subscription ${stripeSubscriptionId}:`, updateError);
      return;
    }
    
    // Record the event
    await supabaseAdmin
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'subscription_updated',
        old_tier: oldTier,
        new_tier: newTier,
        metadata: {
          subscription_id: stripeSubscriptionId,
          status,
          cancel_at_period_end: cancelAtPeriodEnd,
          current_period_end: currentPeriodEnd,
        }
      });
      
    console.log(`Updated subscription for user ${userId}: ${oldTier} -> ${newTier}`);
    
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
  }
}

// Handler for customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription: any) {
  try {
    // Get the subscription details
    const stripeSubscriptionId = subscription.id;
    
    // Find the user subscription in our database
    const { data: userSubscription, error: findError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, tier')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();
      
    if (findError || !userSubscription) {
      console.error(`Error finding subscription ${stripeSubscriptionId}:`, findError || 'Not found');
      return;
    }
    
    const userId = userSubscription.user_id;
    const oldTier = userSubscription.tier;
    
    // Update the subscription in our database to free tier
    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        tier: 'free',
        stripe_subscription_id: null,
        current_period_end: null,
        current_period_start: null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);
      
    if (updateError) {
      console.error(`Error updating subscription ${stripeSubscriptionId}:`, updateError);
      return;
    }
    
    // Record the event
    await supabaseAdmin
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'subscription_deleted',
        old_tier: oldTier,
        new_tier: 'free',
        metadata: {
          subscription_id: stripeSubscriptionId
        }
      });
      
    console.log(`Marked subscription as deleted for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
  }
}

// Handler for invoice.payment_failed event
async function handlePaymentFailed(invoice: any) {
  try {
    // Get the subscription details
    const stripeSubscriptionId = invoice.subscription;
    const amount = invoice.amount_due / 100;
    const currency = invoice.currency;
    
    if (!stripeSubscriptionId) {
      console.error('Missing subscription ID in invoice');
      return;
    }
    
    // Find the user subscription in our database
    const { data: userSubscription, error: findError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();
      
    if (findError || !userSubscription) {
      console.error(`Error finding subscription ${stripeSubscriptionId}:`, findError || 'Not found');
      return;
    }
    
    const userId = userSubscription.user_id;
    
    // Record the payment failure
    await supabaseAdmin
      .from('payment_failures')
      .insert({
        user_id: userId,
        subscription_id: stripeSubscriptionId,
        payment_intent_id: invoice.payment_intent,
        amount,
        currency,
        reason: invoice.last_payment_error?.message || 'Payment failed',
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.number,
          attempt_count: invoice.attempt_count
        }
      });
      
    // Record the event
    await supabaseAdmin
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'payment_failed',
        metadata: {
          subscription_id: stripeSubscriptionId,
          invoice_id: invoice.id,
          amount,
          currency
        }
      });
      
    console.log(`Recorded payment failure for user ${userId}, subscription ${stripeSubscriptionId}`);
    
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error);
  }
}

serve(handler);
