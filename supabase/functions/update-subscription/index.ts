
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
    const { 
      subscriptionId, 
      userId,
      newPriceId,
      newInterval
    } = await req.json();

    if (!subscriptionId || !userId || !newPriceId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Updating subscription ${subscriptionId} to price ${newPriceId} for user ${userId}`);
    
    // Get Stripe secret key from database
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
      console.error("Stripe secret key not found");
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

    // Retrieve the subscription to get current items
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription) {
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the subscription item ID (assuming one item per subscription)
    const subscriptionItemId = subscription.items.data[0].id;
    
    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      // Set proration behavior - by default Stripe prorates
      proration_behavior: "create_prorations",
      // Update metadata with new interval
      metadata: {
        ...subscription.metadata,
        interval: newInterval,
      },
    });

    // Determine the new tier from the price ID
    const newTier = await determineTierFromStripePriceId(newPriceId);
    
    // Update the user's subscription in our database
    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error("Error updating subscription in database:", updateError);
      // Continue anyway as the Stripe update was successful
    }

    // Log the change to subscription_events table
    try {
      // First get the current subscription to determine old tier
      const { data: currentSub } = await supabaseAdmin
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', userId)
        .single();

      const oldTier = currentSub?.tier || 'free';
      const eventType = getTierChangeType(oldTier, newTier);

      await supabaseAdmin.from('subscription_events').insert({
        user_id: userId,
        event_type: eventType,
        old_tier: oldTier,
        new_tier: newTier,
        metadata: {
          subscription_id: subscriptionId,
          price_id: newPriceId,
          interval: newInterval
        }
      });
    } catch (eventError) {
      console.error("Error logging subscription change event:", eventError);
      // Continue anyway as this is just for logging
    }

    return new Response(
      JSON.stringify({
        success: true, 
        subscription: updatedSubscription,
        tier: newTier
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

// Helper function to determine tier from Stripe Price ID
const determineTierFromStripePriceId = async (priceId: string): Promise<string> => {
  try {
    // Query our subscription_plans table to find the tier for this price ID
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('tier')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single();
    
    if (error || !data) {
      console.error('Error determining tier from price ID:', error);
      return 'free'; // Default to free tier if we can't determine
    }
    
    return data.tier;
  } catch (error) {
    console.error(`Error determining tier from price ID ${priceId}:`, error);
    return 'free'; // Default to free tier if we can't determine
  }
};

// Helper function to determine if this is an upgrade or downgrade
const getTierChangeType = (oldTier: string, newTier: string): string => {
  const tierLevels: Record<string, number> = {
    'free': 0,
    'pro': 1,
    'premium': 2,
    'enterprise': 3
  };

  if (tierLevels[newTier] > tierLevels[oldTier]) {
    return 'upgrade';
  } else if (tierLevels[newTier] < tierLevels[oldTier]) {
    return 'downgrade';
  } else {
    return 'update'; // Same tier level, but maybe different interval
  }
};

serve(handler);
