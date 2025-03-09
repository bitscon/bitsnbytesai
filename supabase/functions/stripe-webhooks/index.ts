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
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
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

// Helper function to handle invoice payment failures
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log(`Payment failed for invoice: ${invoice.id}`);
    
    if (!invoice.subscription) {
      console.log("No subscription associated with this invoice");
      return;
    }
    
    // Get subscription details
    const subscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription.id;
    
    console.log(`Payment failed for subscription: ${subscriptionId}`);
    
    // Update payment failure status in user's subscription
    await updatePaymentFailureStatus(subscriptionId, invoice);
    
    // Send admin notification about the payment failure
    await notifyAdminOfPaymentFailure(invoice);
    
    // New: Send email notification to the user about payment failure
    await sendPaymentFailureEmail(invoice, subscriptionId);
  } catch (error) {
    console.error(`Error handling invoice payment failure: ${error.message}`);
  }
}

// New helper function for sending payment failure emails
async function sendPaymentFailureEmail(invoice: Stripe.Invoice, subscriptionId: string) {
  try {
    // Find the subscription in our database
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, tier')
      .eq('stripe_subscription_id', subscriptionId)
      .single();
    
    if (subscriptionError || !subscription) {
      console.error(`Error finding subscription in database: ${subscriptionError?.message || 'Not found'}`);
      return;
    }
    
    // Get subscription plan details for the email
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('name')
      .eq('tier', subscription.tier)
      .single();
    
    if (planError || !plan) {
      console.error(`Error finding plan for tier ${subscription.tier}: ${planError?.message || 'Not found'}`);
      return;
    }
    
    // Generate customer portal URL for updating payment method
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("Stripe secret key not found");
      return;
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    // Get customer ID
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
    
    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${Deno.env.get('SUPABASE_URL') || ''}/subscription`,
    });
    
    // Format failure reason
    const failureReason = invoice.last_payment_error?.message || 
                         "Your payment method was declined. Please update your payment information.";
    
    // Send the email notification
    const response = await fetch(`${Deno.env.get('SUPABASE_URL') || ''}/functions/v1/send-subscription-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({
        userId: subscription.user_id,
        emailType: "payment_failure",
        data: {
          subscriptionName: plan.name,
          failureReason,
          portalUrl: portalSession.url
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error sending payment failure email: ${error}`);
      return;
    }
    
    const result = await response.json();
    console.log(`Payment failure email sent successfully: ${result.emailId}`);
    
  } catch (error) {
    console.error(`Error sending payment failure email: ${error.message}`);
  }
}

// Helper function to handle payment intent failures
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`Payment intent failed: ${paymentIntent.id}`);
    console.log(`Failure reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);
    
    // If this payment intent is associated with an invoice that has a subscription,
    // send a payment failure email to the user
    const invoiceId = paymentIntent.invoice as string;
    if (invoiceId) {
      console.log(`Associated invoice ID: ${invoiceId}`);
      
      // Get Stripe API key
      const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
      if (!stripeSecretKey) {
        console.error("Stripe secret key not found");
        return;
      }
      
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16",
      });
      
      // Get the invoice details
      const invoice = await stripe.invoices.retrieve(invoiceId);
      
      // If the invoice has a subscription, handle it like a regular payment failure
      if (invoice.subscription) {
        await sendPaymentFailureEmail(invoice, invoice.subscription as string);
      }
    }
    
    // Send admin notification about the payment intent failure
    await notifyAdminOfPaymentIntentFailure(paymentIntent);
  } catch (error) {
    console.error(`Error handling payment intent failure: ${error.message}`);
  }
}

// Helper function to update payment failure status in database
async function updatePaymentFailureStatus(subscriptionId: string, invoice: Stripe.Invoice) {
  try {
    // Get the current subscription
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single();
    
    if (fetchError || !subscription) {
      console.error(`Error fetching subscription for ID ${subscriptionId}: ${fetchError?.message || 'Not found'}`);
      return;
    }
    
    // Add a flag in metadata or a separate table to indicate payment failure
    // For this implementation, we'll add a payment_failed_at timestamp to track when payment failed
    
    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        payment_failed_at: new Date().toISOString(),
        payment_failure_reason: invoice.last_payment_error?.message || 'Unknown payment failure',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);
    
    if (updateError) {
      console.error(`Error updating payment failure status: ${updateError.message}`);
    } else {
      console.log(`Updated payment failure status for subscription: ${subscriptionId}`);
    }
  } catch (error) {
    console.error(`Error in updatePaymentFailureStatus: ${error.message}`);
  }
}

// Helper function to notify admin of payment failures
async function notifyAdminOfPaymentFailure(invoice: Stripe.Invoice) {
  try {
    // For now, we'll just log the notification
    // In a production environment, this could send an email or push notification
    console.log(`
      ADMIN NOTIFICATION: Payment Failed
      Invoice ID: ${invoice.id}
      Subscription ID: ${invoice.subscription}
      Customer ID: ${invoice.customer}
      Amount: ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()}
      Attempt Count: ${invoice.attempt_count}
      Next Payment Attempt: ${invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : 'None scheduled'}
      Reason: ${invoice.last_payment_error?.message || 'Unknown'}
    `);
    
    // In the future, you could implement an actual notification system here:
    // 1. Send an email via a service like SendGrid or AWS SES
    // 2. Create an entry in an admin notifications table
    // 3. Send a Slack message or other team communication
    // 4. Trigger an SMS alert for urgent issues
  } catch (error) {
    console.error(`Error notifying admin of payment failure: ${error.message}`);
  }
}

// Helper function to notify admin of payment intent failures
async function notifyAdminOfPaymentIntentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Similar to invoice payment failure notification, but with payment intent specific details
    console.log(`
      ADMIN NOTIFICATION: Payment Intent Failed
      Payment Intent ID: ${paymentIntent.id}
      Customer ID: ${paymentIntent.customer}
      Amount: ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}
      Status: ${paymentIntent.status}
      Error: ${paymentIntent.last_payment_error?.message || 'Unknown'}
    `);
    
    // Additional details that might be relevant
    if (paymentIntent.last_payment_error?.payment_method) {
      const paymentMethod = paymentIntent.last_payment_error.payment_method;
      console.log(`
        Payment Method: ${paymentMethod.type}
        Payment Method ID: ${paymentMethod.id}
        Card: ${paymentMethod.card?.brand} ending in ${paymentMethod.card?.last4}
        Country: ${paymentMethod.card?.country}
      `);
    }
  } catch (error) {
    console.error(`Error notifying admin of payment intent failure: ${error.message}`);
  }
}

serve(handler);
