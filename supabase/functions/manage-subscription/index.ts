
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

  try {
    const { action, userId } = await req.json();

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Managing subscription with action: ${action} for user: ${userId}`);
    
    // Get Stripe secret key from database
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
      console.error("Stripe secret key not found in database or environment");
      return new Response(
        JSON.stringify({ error: "Payment processing is not configured properly" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Initialize Stripe with the retrieved key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get the user's subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (subscriptionError) {
      console.error(`Error retrieving subscription: ${subscriptionError.message}`);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve subscription details" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: "No subscription found for this user" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    switch (action) {
      case 'cancel': {
        // If user doesn't have an active subscription in Stripe, nothing to cancel
        if (!subscription.stripe_subscription_id) {
          return new Response(
            JSON.stringify({ message: "No active subscription to cancel" }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Cancel the subscription at period end
        const canceledSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          { cancel_at_period_end: true }
        );

        return new Response(
          JSON.stringify({
            message: "Subscription will be canceled at the end of the billing period",
            subscription: canceledSubscription
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case 'reactivate': {
        // If user doesn't have a subscription in Stripe, nothing to reactivate
        if (!subscription.stripe_subscription_id) {
          return new Response(
            JSON.stringify({ error: "No subscription found to reactivate" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Remove the cancellation at period end
        const reactivatedSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          { cancel_at_period_end: false }
        );

        return new Response(
          JSON.stringify({
            message: "Subscription has been reactivated",
            subscription: reactivatedSubscription
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case 'portal': {
        // If user doesn't have a customer ID, they can't access the portal
        if (!subscription.stripe_customer_id) {
          return new Response(
            JSON.stringify({ error: "No customer found for this user" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Create a billing portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: subscription.stripe_customer_id,
          return_url: `${req.headers.get('origin')}/subscription`,
        });

        return new Response(
          JSON.stringify({ url: portalSession.url }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error managing subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
