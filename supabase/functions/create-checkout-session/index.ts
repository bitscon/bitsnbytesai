
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { getApiSetting } from "../_shared/api-settings.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

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
      pendingUserPassword,
      isUpgrade = false,
      productId
    } = await req.json();

    if (!priceId && !productId) {
      return new Response(
        JSON.stringify({ error: "Either priceId or productId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
    let finalPriceId = priceId;

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

    // If productId is provided but not priceId, find the corresponding price
    if (productId && !priceId) {
      console.log(`Looking up price for product: ${productId}`);
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 100
      });

      if (prices.data.length === 0) {
        return new Response(
          JSON.stringify({ error: "No pricing found for this product" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Filter by interval
      const intervalPrices = prices.data.filter(price => 
        price.recurring?.interval === interval
      );

      if (intervalPrices.length === 0) {
        // If no price found for requested interval, use the first price
        finalPriceId = prices.data[0].id;
      } else {
        finalPriceId = intervalPrices[0].id;
      }

      console.log(`Selected price ID: ${finalPriceId}`);
    }

    // Check for existing subscriptions if this is an upgrade
    let existingSubscription;
    if (isUpgrade && userId) {
      console.log(`Checking for existing subscriptions for user: ${userId}`);
      const { data: userSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', userId)
        .not('stripe_subscription_id', 'is', null)
        .maybeSingle();

      if (userSubscription?.stripe_subscription_id) {
        try {
          existingSubscription = await stripe.subscriptions.retrieve(
            userSubscription.stripe_subscription_id
          );
          console.log(`Found existing subscription: ${existingSubscription.id}`);
        } catch (error) {
          console.warn(`Could not retrieve subscription: ${error.message}`);
        }
      }
    }

    // Set up the line items for the checkout session
    const lineItems = [{
      price: finalPriceId,
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

    // Determine the mode based on whether this is a one-time payment or subscription
    const mode = "subscription";

    // Create checkout session configuration
    const sessionConfig: any = {
      customer,
      line_items: lineItems,
      mode,
      subscription_data: subscriptionData,
      success_url: success_url || `${Deno.env.get("SITE_URL") || "http://localhost:3000"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${Deno.env.get("SITE_URL") || "http://localhost:3000"}/subscription`,
      metadata: metadata,
    };

    // If this is an upgrade with an existing subscription, use checkout session with subscription update
    if (isUpgrade && existingSubscription && existingSubscription.status === 'active') {
      console.log(`Creating checkout session for subscription update`);
      sessionConfig.mode = 'payment';
      sessionConfig.payment_method_types = ['card'];
      sessionConfig.customer_update = {
        name: 'auto',
        address: 'auto',
      };
      
      // Remove subscription_data since this is a payment mode session
      delete sessionConfig.subscription_data;
      
      // Add metadata to identify this as an upgrade
      sessionConfig.metadata.is_upgrade = 'true';
      sessionConfig.metadata.existing_subscription_id = existingSubscription.id;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

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
