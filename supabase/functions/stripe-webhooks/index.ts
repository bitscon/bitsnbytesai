
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  try {
    // Get Stripe secret key and signing secret from API settings
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = await getApiSetting("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error("Missing Stripe configuration");
      return new Response(
        JSON.stringify({ error: "Stripe configuration is incomplete" }),
        { status: 500 }
      );
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      console.error("Missing Stripe signature");
      return new Response(
        JSON.stringify({ error: "Missing Stripe signature" }),
        { status: 400 }
      );
    }
    
    // Get the request body
    const body = await req.text();
    
    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400 }
      );
    }
    
    console.log(`Received Stripe webhook event: ${event.type}`);
    
    // Handle the event based on type
    switch (event.type) {
      case 'checkout.session.completed': {
        // Payment is successful and the subscription is created
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode !== 'subscription') {
          console.log("Not a subscription session, skipping");
          break;
        }
        
        // Process the session (this is handled separately in verify-subscription endpoint)
        console.log(`Checkout session completed: ${session.id}`);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, stripe);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(JSON.stringify({ received: true }), { status: 200 });
    
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
};

// Helper function to handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription, stripe: Stripe) {
  try {
    console.log(`Subscription updated: ${subscription.id}`);
    
    // Get the current price ID
    const priceId = subscription.items.data[0].price.id;
    
    // Find the subscription plan in our database
    const { data: planData } = await supabaseAdmin
      .from('subscription_plans')
      .select('tier')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single();
      
    if (!planData) {
      console.error(`No subscription plan found for price ID: ${priceId}`);
      return;
    }
    
    // Update the subscription in our database
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        tier: planData.tier,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
      
    if (error) {
      console.error(`Error updating subscription in database: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error handling subscription update: ${error.message}`);
  }
}

// Helper function to handle subscription deletions
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log(`Subscription deleted: ${subscription.id}`);
    
    // Update the user's subscription to free tier
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        tier: 'free',
        stripe_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
      
    if (error) {
      console.error(`Error updating subscription in database: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error handling subscription deletion: ${error.message}`);
  }
}

// Helper function to handle payment failures
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log(`Payment failed for invoice: ${invoice.id}`);
    
    if (invoice.subscription) {
      // Log the payment failure - could add notification logic here
      console.log(`Payment failed for subscription: ${invoice.subscription}`);
    }
  } catch (error) {
    console.error(`Error handling payment failure: ${error.message}`);
  }
}

serve(handler);
