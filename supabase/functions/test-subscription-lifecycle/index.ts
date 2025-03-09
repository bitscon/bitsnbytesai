
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";
import Stripe from "https://esm.sh/stripe@12.5.0?target=deno";
import { CREATE_SUBSCRIPTION_EVENTS_FUNCTION, CREATE_PAYMENT_FAILURES_FUNCTION, VALIDATE_SUBSCRIPTION } from "../_shared/sql-scripts.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get the request body
    const { userId, action, skipStripeCalls } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify that the user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ensure required tables exist
    await supabaseAdmin.rpc("create_subscription_events_if_not_exists");
    await supabaseAdmin.rpc("create_payment_failures_if_not_exists");

    // Create the validation function if it doesn't exist
    try {
      await supabaseAdmin.rpc("validate_subscription_data", { user_uuid: userId });
    } catch (error) {
      console.log("Creating validation function...");
      await supabaseAdmin.sql(VALIDATE_SUBSCRIPTION);
    }

    // Perform the requested action
    let result;
    switch (action) {
      case "validate":
        result = await validateSubscription(userId);
        break;
      case "simulate-payment-failure":
        result = await simulatePaymentFailure(userId, skipStripeCalls);
        break;
      case "simulate-full-lifecycle":
        result = await simulateFullLifecycle(userId, skipStripeCalls);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in test-subscription-lifecycle:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function validateSubscription(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("validate_subscription_data", {
    user_uuid: userId,
  });

  if (error) {
    throw error;
  }

  // Check if user has a subscription record, if not create one
  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  let subscriptionStatus = "existing";
  if (subscriptionError || !subscription) {
    // Create a free tier subscription
    const { error: createError } = await supabaseAdmin
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        tier: "free",
      });

    if (createError) {
      throw createError;
    }
    subscriptionStatus = "created";
  }

  return {
    validation: data,
    subscription: subscription || { tier: "free", user_id: userId },
    subscriptionStatus,
  };
}

async function simulatePaymentFailure(userId: string, skipStripeCalls = true) {
  // Get the user's subscription
  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (subscriptionError || !subscription) {
    throw new Error("User subscription not found");
  }

  // Create a payment failure record
  const { data: failure, error: failureError } = await supabaseAdmin
    .from("payment_failures")
    .insert({
      user_id: userId,
      subscription_id: subscription.stripe_subscription_id || "test_sub_123",
      payment_intent_id: `test_pi_${Date.now()}`,
      amount: 9.99,
      currency: "usd",
      reason: "Test payment failure",
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    })
    .select();

  if (failureError) {
    throw failureError;
  }

  // If we have Stripe credentials and not skipping Stripe calls, make a test call
  let stripeResult = { skipStripeCalls };
  if (!skipStripeCalls && subscription.stripe_subscription_id) {
    try {
      const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
      if (stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: "2023-10-16",
        });
        
        // Just fetch the subscription to verify Stripe connection
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );
        
        stripeResult = {
          skipStripeCalls: false,
          stripeConnection: "success",
          subscriptionStatus: stripeSubscription.status,
        };
      } else {
        stripeResult = {
          skipStripeCalls: false,
          stripeConnection: "failed",
          error: "Stripe key not found",
        };
      }
    } catch (error) {
      stripeResult = {
        skipStripeCalls: false,
        stripeConnection: "failed",
        error: error.message,
      };
    }
  }

  return {
    paymentFailure: failure[0],
    subscription,
    stripe: stripeResult,
  };
}

async function simulateFullLifecycle(userId: string, skipStripeCalls = true) {
  // First validate the current subscription
  const validationResult = await validateSubscription(userId);

  // Simulate a tier change (upgrade)
  const { data: subscription } = await supabaseAdmin
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  const oldTier = subscription.tier;
  const newTier = oldTier === "free" ? "pro" : 
                 oldTier === "pro" ? "premium" : 
                 oldTier === "premium" ? "enterprise" : "pro";

  // Update the subscription tier
  const { data: updatedSubscription, error: updateError } = await supabaseAdmin
    .from("user_subscriptions")
    .update({
      tier: newTier,
      stripe_customer_id: subscription.stripe_customer_id || `test_cus_${Date.now()}`,
      stripe_subscription_id: subscription.stripe_subscription_id || `test_sub_${Date.now()}`,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  // Log a subscription event
  const { data: event, error: eventError } = await supabaseAdmin
    .from("subscription_events")
    .insert({
      user_id: userId,
      event_type: "upgrade",
      old_tier: oldTier,
      new_tier: newTier,
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    })
    .select();

  if (eventError) {
    throw eventError;
  }

  // Simulate a payment failure
  const paymentFailureResult = await simulatePaymentFailure(userId, skipStripeCalls);

  // Run validation again
  const finalValidation = await validateSubscription(userId);

  return {
    initialValidation: validationResult,
    tierChange: {
      oldTier,
      newTier,
      subscription: updatedSubscription,
      event: event[0],
    },
    paymentFailure: paymentFailureResult,
    finalValidation: finalValidation.validation,
  };
}

serve(handler);
