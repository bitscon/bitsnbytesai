
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  try {
    // Get Stripe secret key and webhook secret from database
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = await getApiSetting("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error("Stripe secret key or webhook secret not found");
      return new Response(
        JSON.stringify({ error: "Configuration issue" }),
        { status: 500 }
      );
    }
    
    // Initialize Stripe with the retrieved key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { status: 400 }
      );
    }

    // Get the raw request body
    const reqBody = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        reqBody,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400 }
      );
    }

    console.log(`Webhook received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, stripe);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error(`Error handling webhook: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
};

async function handleSubscriptionChange(subscription: any) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const planId = subscription.items.data[0].plan.id;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  console.log(`Processing subscription change: ${subscriptionId}, status: ${status}, plan: ${planId}`);

  try {
    // Determine subscription tier based on price ID
    let tier = 'free';
    
    // Query subscription plans to get the tier from price ID
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('tier')
      .or(`stripe_price_id_monthly.eq.${planId},stripe_price_id_yearly.eq.${planId}`)
      .single();
    
    if (plansError) {
      console.error(`Error fetching subscription tier: ${plansError.message}`);
    } else if (plans) {
      tier = plans.tier;
    }
    
    // Get user by customer ID
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (customersError) {
      console.error(`Error finding user by customer ID: ${customersError.message}`);
      return;
    }

    let userId;
    if (customers) {
      userId = customers.user_id;
      console.log(`Found existing user subscription for user: ${userId}`);

      // Update the subscription
      const { error: updateError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
          tier,
          stripe_subscription_id: subscriptionId,
          current_period_start,
          current_period_end,
          updated_at: new Date()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error(`Error updating subscription: ${updateError.message}`);
      } else {
        console.log(`Updated subscription for user: ${userId} to tier: ${tier}`);
      }
    } else {
      console.log(`No user found for customer ID: ${customerId}`);
      // We don't have a user ID yet, will create the record when checkout.session.completed
    }
  } catch (error) {
    console.error(`Error in handleSubscriptionChange: ${error.message}`);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  console.log(`Processing subscription cancellation: ${subscriptionId}`);

  try {
    // Find the user by customer ID
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (customersError) {
      console.error(`Error finding user by customer ID: ${customersError.message}`);
      return;
    }

    if (customers) {
      const userId = customers.user_id;
      
      // Update the subscription to free tier
      const { error: updateError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
          tier: 'free',
          stripe_subscription_id: null,
          current_period_start: null,
          current_period_end: null,
          updated_at: new Date()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error(`Error updating subscription: ${updateError.message}`);
      } else {
        console.log(`Downgraded subscription for user: ${userId} to free tier`);
      }
    } else {
      console.log(`No user found for customer ID: ${customerId}`);
    }
  } catch (error) {
    console.error(`Error in handleSubscriptionCancelled: ${error.message}`);
  }
}

async function handleCheckoutCompleted(session: any, stripe: any) {
  const sessionId = session.id;
  const customerId = session.customer;
  const userEmail = session.customer_email || session.metadata?.email;
  const subscriptionId = session.subscription;

  console.log(`Processing checkout completion: ${sessionId} for email: ${userEmail}`);

  try {
    if (!userEmail) {
      console.error("No email found in checkout session");
      return;
    }

    // Get user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(userEmail);
    
    if (userError || !userData?.user) {
      console.error(`Error finding user by email: ${userError?.message}`);
      return;
    }

    const userId = userData.user.id;
    console.log(`Found user by email: ${userId}`);

    // Check if user already has a subscription record
    const { data: existingSub, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (subError) {
      console.error(`Error checking existing subscription: ${subError.message}`);
    }

    if (existingSub) {
      // Subscription record already exists and will be updated by subscription.created/updated event
      console.log(`User ${userId} already has a subscription record`);
    } else {
      // Create new subscription record
      const { error: insertError } = await supabaseAdmin
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          tier: 'pro', // Default to pro until we get the actual plan from subscription event
          updated_at: new Date()
        });

      if (insertError) {
        console.error(`Error creating subscription record: ${insertError.message}`);
      } else {
        console.log(`Created subscription record for user: ${userId}`);
      }
    }

    // Get subscription details to update with the correct tier
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await handleSubscriptionChange(subscription);
    }
  } catch (error) {
    console.error(`Error in handleCheckoutCompleted: ${error.message}`);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  console.log(`Processing successful payment for subscription: ${subscriptionId}`);

  try {
    // Find the user by customer ID
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (customersError) {
      console.error(`Error finding user by customer ID: ${customersError.message}`);
      return;
    }

    if (customers) {
      const userId = customers.user_id;
      
      // Update the subscription end date based on the new invoice
      const { error: updateError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
          current_period_end: new Date(invoice.period_end * 1000),
          updated_at: new Date()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error(`Error updating subscription period: ${updateError.message}`);
      } else {
        console.log(`Updated subscription period for user: ${userId}`);
      }
    } else {
      console.log(`No user found for customer ID: ${customerId}`);
    }
  } catch (error) {
    console.error(`Error in handlePaymentSucceeded: ${error.message}`);
  }
}

async function handlePaymentFailed(invoice: any) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  console.log(`Processing failed payment for subscription: ${subscriptionId}`);

  // We don't immediately downgrade the user, as Stripe will attempt to collect payment
  // multiple times. If the subscription is eventually cancelled, we'll handle that in
  // the subscription.deleted event.
  
  try {
    // Find the user by customer ID
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (customersError) {
      console.error(`Error finding user by customer ID: ${customersError.message}`);
      return;
    }

    if (customers) {
      const userId = customers.user_id;
      
      // Just log the payment failure for now
      console.log(`Payment failed for user: ${userId}, subscription: ${subscriptionId}`);
      
      // Could implement notification logic here
    } else {
      console.log(`No user found for customer ID: ${customerId}`);
    }
  } catch (error) {
    console.error(`Error in handlePaymentFailed: ${error.message}`);
  }
}

serve(handler);
