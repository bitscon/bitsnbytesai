
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
    const body = await req.json().catch(() => ({}));
    const { userId, subscriptionId } = body;

    if (!userId && !subscriptionId) {
      return new Response(
        JSON.stringify({ error: "Either User ID or Subscription ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Fetching subscription for ${userId ? `user: ${userId}` : `subscription: ${subscriptionId}`}`);
    
    // Query condition based on what we have
    const queryCondition = userId ? { user_id: userId } : { stripe_subscription_id: subscriptionId };

    // Get the user's subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq(userId ? 'user_id' : 'stripe_subscription_id', userId || subscriptionId)
      .maybeSingle();

    if (subscriptionError) {
      console.error(`Error retrieving subscription: ${subscriptionError.message}`);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve subscription details", details: subscriptionError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let stripeSubscription = null;
    let cancelAtPeriodEnd = false;
    let fallbackSubscription = null;

    // If no subscription found, provide a default free tier one for the user
    if (!subscription && userId) {
      console.log(`No subscription found for user ${userId}, creating a default free one`);
      fallbackSubscription = {
        tier: 'free',
        user_id: userId,
      };
      
      // Try to create the subscription in the database
      try {
        const { data: newSub, error: createError } = await supabaseAdmin
          .from('user_subscriptions')
          .insert(fallbackSubscription)
          .select()
          .single();
          
        if (createError) {
          console.error(`Error creating default subscription: ${createError.message}`);
        } else if (newSub) {
          console.log(`Created default subscription for user ${userId}`);
          fallbackSubscription = newSub;
        }
      } catch (e) {
        console.error(`Exception creating default subscription: ${e.message}`);
      }
    }

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
    if ((!subscription && fallbackSubscription) || (subscription?.tier === 'free')) {
      const userIdToUse = userId || subscription?.user_id;
      
      if (userIdToUse) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
        const currentYear = currentDate.getFullYear();

        const { data: usage, error: usageError } = await supabaseAdmin
          .from('user_prompt_usage')
          .select('count')
          .eq('user_id', userIdToUse)
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
    }

    // Get the user's plan details
    let planDetails = null;
    const tierToUse = subscription?.tier || fallbackSubscription?.tier;
    
    if (tierToUse) {
      const { data: plan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('tier', tierToUse)
        .single();

      if (planError) {
        console.error(`Error retrieving plan details: ${planError.message}`);
      } else {
        planDetails = plan;
      }
    }

    return new Response(
      JSON.stringify({
        subscription: subscription || fallbackSubscription || { tier: 'free' },
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
