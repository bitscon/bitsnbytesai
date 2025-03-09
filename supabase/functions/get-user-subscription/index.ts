
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    let stripeSubscription = null;
    let cancelAtPeriodEnd = false;

    // If user has a Stripe subscription, get additional details
    if (subscription?.stripe_subscription_id) {
      // Get Stripe secret key from database
      const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
      
      if (!stripeSecretKey) {
        console.error("Stripe secret key not found");
      } else {
        // Initialize Stripe with the retrieved key
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: "2023-10-16",
        });

        try {
          const stripeData = await stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id
          );
          cancelAtPeriodEnd = stripeData.cancel_at_period_end;
          stripeSubscription = {
            id: stripeData.id,
            status: stripeData.status,
            current_period_end: new Date(stripeData.current_period_end * 1000),
            cancel_at_period_end: cancelAtPeriodEnd,
            plan: {
              id: stripeData.items.data[0].plan.id,
              nickname: stripeData.items.data[0].plan.nickname,
              amount: stripeData.items.data[0].plan.amount,
              interval: stripeData.items.data[0].plan.interval,
            }
          };
        } catch (stripeError) {
          console.error(`Error retrieving Stripe subscription: ${stripeError.message}`);
        }
      }
    }

    // Get current usage for free tier users
    let currentUsage = null;
    if (!subscription || subscription.tier === 'free') {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
      const currentYear = currentDate.getFullYear();

      const { data: usage, error: usageError } = await supabaseAdmin
        .from('user_prompt_usage')
        .select('count')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (usageError) {
        console.error(`Error retrieving usage: ${usageError.message}`);
      } else {
        currentUsage = {
          count: usage?.count || 0,
          limit: 50, // Free tier limit
          remaining: 50 - (usage?.count || 0)
        };
      }
    }

    // Get the user's plan details
    let planDetails = null;
    if (subscription) {
      const { data: plan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('tier', subscription.tier)
        .single();

      if (planError) {
        console.error(`Error retrieving plan details: ${planError.message}`);
      } else {
        planDetails = plan;
      }
    }

    return new Response(
      JSON.stringify({
        subscription: subscription || { tier: 'free' },
        stripeSubscription,
        cancelAtPeriodEnd,
        currentUsage,
        planDetails
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error retrieving user subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
