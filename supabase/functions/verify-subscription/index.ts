
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
    const { sessionId, userId, customerId } = await req.json();

    if (!sessionId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Verifying subscription for session: ${sessionId}, user: ${userId}`);
    
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

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.status !== "complete") {
      console.log(`Session not completed: ${sessionId}, status: ${session.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Payment has not been completed" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      console.log(`Subscription not active: ${subscription.id}, status: ${subscription.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Subscription is not active" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get subscription plan details
    const planId = subscription.items.data[0].plan.id;
    
    // Determine tier based on plan ID
    let tier = 'pro'; // Default
    
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

    // Check if we already have a subscription record for this user
    const { data: existingSub, error: checkError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error(`Error checking existing subscription: ${checkError.message}`);
    }

    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
          tier,
          stripe_customer_id: customerId || session.customer as string,
          stripe_subscription_id: subscription.id,
          current_period_start,
          current_period_end,
          updated_at: new Date()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error(`Error updating subscription: ${updateError.message}`);
        return new Response(
          JSON.stringify({ error: "Failed to update subscription record" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Create new subscription record
      const { error: insertError } = await supabaseAdmin
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier,
          stripe_customer_id: customerId || session.customer as string,
          stripe_subscription_id: subscription.id,
          current_period_start,
          current_period_end
        });

      if (insertError) {
        console.error(`Error creating subscription record: ${insertError.message}`);
        return new Response(
          JSON.stringify({ error: "Failed to create subscription record" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    console.log(`Subscription verified for user: ${userId}, tier: ${tier}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        tier,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: currentPeriodEnd
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
