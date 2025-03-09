
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
        JSON.stringify({ 
          success: false, 
          message: "Missing required parameters" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Verifying subscription for session: ${sessionId}, user: ${userId}`);
    
    // Get Stripe API key
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Payment configuration is incomplete" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });
    
    if (!session) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid session ID" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (session.status !== 'complete') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Payment not completed" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Get subscription details
    const subscription = session.subscription as Stripe.Subscription;
    const customer = session.customer as Stripe.Customer;
    
    if (!subscription) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No subscription found for this session" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Determine the subscription tier based on price ID
    const priceId = subscription.items.data[0].price.id;
    
    // Get the subscription plan associated with this price ID
    const { data: planData, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('tier, name')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single();
    
    if (planError || !planData) {
      console.error("Error finding subscription plan:", planError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Subscription plan not found" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const tier = planData.tier;
    const tierName = planData.name;
    
    // Save the subscription details in our database
    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier: tier,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (updateError) {
      console.error("Error updating user subscription:", updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to update subscription record" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        tier: tierName, 
        subscription_id: subscription.id,
        customer_id: customer.id,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "An error occurred while verifying the subscription" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
