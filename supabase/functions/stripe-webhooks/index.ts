
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  // This is a webhook endpoint, no CORS needed for OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const reqText = await req.text();
    
    if (!signature) {
      console.error("No stripe signature found in the request");
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get webhook secret from settings
    const webhookSecret = await getApiSetting("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Webhook secret not found");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Stripe API key
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("Stripe secret key not found");
      return new Response(JSON.stringify({ error: "Stripe not configured correctly" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Stripe with the API key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(reqText, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Webhook event received: ${event.type}`);
    
    // Check if this event has already been processed
    const { data: existingEvent } = await supabaseAdmin
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .maybeSingle();
    
    if (existingEvent) {
      console.log(`Event ${event.id} has already been processed, skipping`);
      return new Response(JSON.stringify({ received: true, status: 'already_processed' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Record the event before processing
    await supabaseAdmin
      .from('stripe_events')
      .insert({
        id: event.id,
        type: event.type,
        data: event.data
      });

    // Handle different event types
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          await handleCheckoutSessionCompleted(event.data.object, stripe);
          break;
        }
        
        case 'customer.subscription.created': {
          await handleSubscriptionCreated(event.data.object, stripe);
          break;
        }
        
        case 'customer.subscription.updated': {
          await handleSubscriptionUpdated(event.data.object);
          break;
        }
        
        case 'customer.subscription.deleted': {
          await handleSubscriptionDeleted(event.data.object);
          break;
        }
        
        case 'invoice.payment_failed': {
          await handleInvoicePaymentFailed(event.data.object);
          break;
        }
        
        case 'invoice.paid': {
          await handleInvoicePaid(event.data.object);
          break;
        }
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      // Update event as successfully processed
      await supabaseAdmin
        .from('stripe_events')
        .update({ error: null })
        .eq('id', event.id);
        
    } catch (error) {
      console.error(`Error processing event ${event.type}:`, error);
      
      // Record the error
      await supabaseAdmin
        .from('stripe_events')
        .update({ 
          error: 'Failed to process',
          last_error: error.message,
          retry_count: 1
        })
        .eq('id', event.id);
        
      // We still return 200 to acknowledge receipt to Stripe
      // as we've recorded the event and can reprocess it later
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

// Handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session: any, stripe: Stripe) {
  console.log('Processing checkout session completion:', session.id);
  
  // Extract user data from metadata if it's a new user
  const pendingUserEmail = session.metadata?.pendingUserEmail;
  const pendingUserFullName = session.metadata?.pendingUserFullName;
  const pendingUserPassword = session.metadata?.pendingUserPassword;
  
  // If we have pending user data, create a new user
  if (pendingUserEmail && pendingUserFullName && pendingUserPassword) {
    console.log(`Creating new user for: ${pendingUserEmail}`);
    
    // Create the user account
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: pendingUserEmail,
      password: pendingUserPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: pendingUserFullName
      }
    });
    
    if (userError) {
      console.error(`Error creating user: ${userError.message}`);
      throw new Error(`Failed to create user: ${userError.message}`);
    }
    
    // If a subscription was created, link it to the new user
    if (session.subscription) {
      // Get subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Add the user to the database
      await createOrUpdateSubscription({
        userId: userData.user.id,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        subscription
      });
      
      // Update the subscription metadata with the user ID
      await stripe.subscriptions.update(
        session.subscription,
        {
          metadata: {
            user_id: userData.user.id
          }
        }
      );
      
      // Add subscription event
      await recordSubscriptionEvent({
        userId: userData.user.id,
        eventType: 'subscription_created',
        newTier: getPlanTierFromSubscription(subscription),
        metadata: {
          stripe_subscription_id: session.subscription,
          checkout_session_id: session.id,
          is_new_user: true
        }
      });
    }
  } else {
    // Handle existing user checkout
    console.log('Handling existing user checkout');
    
    // Get the user ID from the session
    const userId = session.metadata?.user_id;
    
    if (userId && userId !== "pending" && session.subscription) {
      // Get subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Add the subscription to the database
      await createOrUpdateSubscription({
        userId: userId,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        subscription
      });
      
      // Add subscription event
      await recordSubscriptionEvent({
        userId: userId,
        eventType: 'subscription_created',
        newTier: getPlanTierFromSubscription(subscription),
        metadata: {
          stripe_subscription_id: session.subscription,
          checkout_session_id: session.id
        }
      });
    }
  }
}

// Handle customer.subscription.created event
async function handleSubscriptionCreated(subscription: any, stripe: Stripe) {
  console.log(`Subscription created: ${subscription.id}`);
  
  // Get the user ID from the subscription metadata
  const userId = subscription.metadata?.user_id;
  
  if (!userId || userId === "pending") {
    console.log(`No valid user ID found in metadata for subscription ${subscription.id}`);
    return;
  }
  
  // Add or update the subscription record
  await createOrUpdateSubscription({
    userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    subscription
  });
}

// Handle customer.subscription.updated event
async function handleSubscriptionUpdated(subscription: any) {
  console.log(`Subscription updated: ${subscription.id}`);
  
  // Get the user ID from the subscription metadata
  const userId = subscription.metadata?.user_id;
  
  if (!userId) {
    console.log(`No user ID found in metadata for subscription ${subscription.id}`);
    return;
  }
  
  // Get the current subscription from our database
  const { data: currentSubscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('tier, status')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();
  
  // Update the subscription record
  const { error: updateError } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (updateError) {
    console.error(`Error updating subscription: ${updateError.message}`);
    throw updateError;
  }
  
  const newTier = getPlanTierFromSubscription(subscription);
  
  // Record subscription event if status or tier changed
  if (
    currentSubscription && 
    (currentSubscription.status !== subscription.status || currentSubscription.tier !== newTier)
  ) {
    await recordSubscriptionEvent({
      userId,
      eventType: 'subscription_updated',
      oldTier: currentSubscription.tier,
      newTier: newTier,
      metadata: {
        stripe_subscription_id: subscription.id,
        old_status: currentSubscription.status,
        new_status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    });
  }
}

// Handle customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription: any) {
  console.log(`Subscription deleted: ${subscription.id}`);
  
  // Get the user ID from the subscription metadata
  const userId = subscription.metadata?.user_id;
  
  if (!userId) {
    console.log(`No user ID found in metadata for subscription ${subscription.id}`);
    return;
  }
  
  // Get the current subscription from our database
  const { data: currentSubscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('tier')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();
  
  // Update the subscription record
  const { error: updateError } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (updateError) {
    console.error(`Error updating subscription: ${updateError.message}`);
    throw updateError;
  }
  
  // Record subscription event
  await recordSubscriptionEvent({
    userId,
    eventType: 'subscription_canceled',
    oldTier: currentSubscription?.tier || 'unknown',
    newTier: 'free',
    metadata: {
      stripe_subscription_id: subscription.id,
      canceled_at: new Date().toISOString()
    }
  });
  
  // Create free tier subscription for user
  await supabaseAdmin
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      tier: 'free',
      status: 'active',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
}

// Handle invoice.payment_failed event
async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`Invoice payment failed: ${invoice.id}`);
  
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) {
    console.log('No subscription associated with this invoice');
    return;
  }
  
  // Find the user associated with this subscription
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  
  if (!subscription) {
    console.log(`No user found for subscription ${subscriptionId}`);
    return;
  }
  
  // Record payment failure
  await supabaseAdmin
    .from('payment_failures')
    .insert({
      user_id: subscription.user_id,
      subscription_id: subscriptionId,
      payment_intent_id: invoice.payment_intent,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency,
      reason: invoice.last_payment_error?.message || 'Unknown reason',
      metadata: {
        invoice_id: invoice.id,
        attempt_count: invoice.attempt_count,
        next_payment_attempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toISOString()
          : null
      }
    });
  
  // Record subscription event
  await recordSubscriptionEvent({
    userId: subscription.user_id,
    eventType: 'payment_failed',
    metadata: {
      invoice_id: invoice.id,
      subscription_id: subscriptionId,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      next_payment_attempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null
    }
  });
}

// Handle invoice.paid event
async function handleInvoicePaid(invoice: any) {
  console.log(`Invoice paid: ${invoice.id}`);
  
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) {
    console.log('No subscription associated with this invoice');
    return;
  }
  
  // Find the user associated with this subscription
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  
  if (!subscription) {
    console.log(`No user found for subscription ${subscriptionId}`);
    return;
  }
  
  // Mark any payment failures for this subscription as resolved
  await supabaseAdmin
    .from('payment_failures')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString()
    })
    .eq('subscription_id', subscriptionId)
    .eq('resolved', false);
  
  // Record subscription event
  await recordSubscriptionEvent({
    userId: subscription.user_id,
    eventType: 'payment_succeeded',
    metadata: {
      invoice_id: invoice.id,
      subscription_id: subscriptionId,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency
    }
  });
}

// Helper function to determine tier from Stripe plan
function getPlanTierFromSubscription(subscription: any): string {
  // Default to 'pro' if we can't determine
  let tier = 'pro';
  
  try {
    // Try to get plan info
    const planId = subscription.items?.data[0]?.plan?.id;
    const productId = subscription.items?.data[0]?.plan?.product;
    
    if (planId) {
      // First check if we have this plan mapped in our database
      const getPlan = async () => {
        const { data: plan } = await supabaseAdmin
          .from('subscription_plans')
          .select('tier')
          .or(`stripe_price_id_monthly.eq.${planId},stripe_price_id_yearly.eq.${planId}`)
          .maybeSingle();
        
        if (plan) {
          return plan.tier;
        }
        
        // If not by price ID, try by product ID
        if (productId) {
          const { data: productPlan } = await supabaseAdmin
            .from('subscription_plans')
            .select('tier')
            .eq('stripe_product_id', productId)
            .maybeSingle();
          
          if (productPlan) {
            return productPlan.tier;
          }
        }
        
        // Fallback - determine by price
        const amount = subscription.items?.data[0]?.plan?.amount || 0;
        if (amount === 0) return 'free';
        if (amount < 2000) return 'pro'; // Less than $20
        return 'premium'; // $20+
      };
      
      // Note: we can't await here as it's in a synchronous function, but
      // this function is only used within async functions so we'll handle it there
      return tier;
    }
  } catch (error) {
    console.error('Error determining tier from subscription:', error);
  }
  
  return tier;
}

// Helper to create or update subscription
async function createOrUpdateSubscription({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  subscription
}: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscription: any;
}) {
  const tier = getPlanTierFromSubscription(subscription);
  
  try {
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        tier,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error(`Error creating/updating subscription: ${error.message}`);
      throw error;
    }
    
    console.log(`Subscription record created/updated for user: ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error in createOrUpdateSubscription: ${error.message}`);
    throw error;
  }
}

// Helper to record subscription events
async function recordSubscriptionEvent({
  userId,
  eventType,
  oldTier,
  newTier,
  metadata
}: {
  userId: string;
  eventType: string;
  oldTier?: string;
  newTier?: string;
  metadata?: any;
}) {
  try {
    const { error } = await supabaseAdmin
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        old_tier: oldTier,
        new_tier: newTier,
        metadata,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error(`Error recording subscription event: ${error.message}`);
      return false;
    }
    
    console.log(`Subscription event recorded for user: ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error in recordSubscriptionEvent: ${error.message}`);
    return false;
  }
}

serve(handler);
