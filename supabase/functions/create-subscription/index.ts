
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
    const { priceId, interval, email, success_url, cancel_url, customerId } = await req.json();

    if (!priceId || !email || !success_url || !cancel_url || !interval) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Creating subscription for email: ${email}, price: ${priceId}, interval: ${interval}`);
    
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

    let customer;

    if (customerId) {
      // Use existing customer if provided
      customer = await stripe.customers.retrieve(customerId);
      console.log(`Using existing customer: ${customerId}`);
    } else {
      // Create a new customer
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          email: email,
        },
      });
      console.log(`Created new customer: ${customer.id}`);
    }

    // Create a checkout session for the subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
      customer: customer.id,
      customer_email: customerId ? undefined : email, // Only set if not using existing customer
      subscription_data: {
        metadata: {
          email: email,
        },
      },
      metadata: {
        email: email,
        interval: interval, // 'month' or 'year'
      },
    });

    console.log(`Subscription checkout session created: ${session.id}`);

    return new Response(JSON.stringify({ url: session.url, customerId: customer.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
