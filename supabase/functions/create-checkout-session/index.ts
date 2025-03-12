import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      priceId,
      email,
      interval = 'month',
      success_url,
      cancel_url,
      customerId,
      userId,
      pendingUserEmail,
      pendingUserFullName,
      pendingUserPassword
    } = await req.json();

    const isNewUserFlow = pendingUserEmail && pendingUserFullName && pendingUserPassword;

    // Get Stripe secret key from database
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
      console.error("Stripe secret key not found in database");
      return new Response(
        JSON.stringify({ error: "Payment processing is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Set up checkout session parameters
    let customer;

    // If there's an existing customer ID, use it
    if (customerId) {
      console.log(`Using existing customer: ${customerId}`);
      customer = customerId;
    } 
    // Otherwise, create a new customer if we have an email
    else if (email) {
      console.log(`Creating new customer for email: ${email}`);
      const newCustomer = await stripe.customers.create({
        email: email,
        metadata: {
          user_id: userId || "pending",
        },
      });
      customer = newCustomer.id;
    }

    // Set up the line items for the checkout session
    const lineItems = [{
      price: priceId,
      quantity: 1,
    }];

    // Configure subscription data if this is a subscription
    const subscriptionData = {
      trial_period_days: null,
      metadata: {
        user_id: userId || "pending",
      },
    };

    // Set up metadata to include pending user info if this is a signup flow
    const metadata = {
      user_id: userId || "pending",
    };

    // Add pending user details to metadata if provided
    if (isNewUserFlow) {
      metadata.pendingUserEmail = pendingUserEmail;
      metadata.pendingUserFullName = pendingUserFullName;
      metadata.pendingUserPassword = pendingUserPassword;
      console.log('Adding pending user details to checkout session');
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer,
      line_items: lineItems,
      mode: "subscription",
      subscription_data: subscriptionData,
      success_url: success_url || `${Deno.env.get("SITE_URL") || "http://localhost:3000"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${Deno.env.get("SITE_URL") || "http://localhost:3000"}/subscription`,
      metadata: metadata,
    });

    console.log(`Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        customerId: customer,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-checkout-session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
