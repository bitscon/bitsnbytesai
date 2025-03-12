
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  // This is a webhook endpoint, no CORS needed for OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const reqText = await req.text();
    
    if (!signature) {
      console.error("No stripe signature found in the request");
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get webhook secret from settings
    const webhookSecret = await getApiSetting("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Webhook secret not found");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Stripe API key
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("Stripe secret key not found");
      return new Response(JSON.stringify({ error: "Stripe not configured correctly" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Stripe with the API key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(reqText, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Webhook event received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing checkout session completion:', session.id);
        
        // Extract user data from metadata if it's a new user
        const pendingUserEmail = session.metadata?.pendingUserEmail;
        const pendingUserFullName = session.metadata?.pendingUserFullName;
        const pendingUserPassword = session.metadata?.pendingUserPassword;
        
        // If we have pending user data, create a new user
        if (pendingUserEmail && pendingUserFullName && pendingUserPassword) {
          console.log(`Creating new user for: ${pendingUserEmail}`);
          
          // Create the user account
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: pendingUserEmail,
            password: pendingUserPassword,
            email_confirm: true, // Auto-confirm the email
            user_metadata: {
              full_name: pendingUserFullName
            }
          });
          
          if (userError) {
            console.error(`Error creating user: ${userError.message}`);
            return new Response(JSON.stringify({ error: `Failed to create user: ${userError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          // Now update the subscription with the new user ID
          if (session.subscription) {
            // Add the user to the database
            const { error: subscriptionError } = await supabaseAdmin
              .from('user_subscriptions')
              .insert({
                user_id: userData.user.id,
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription,
                tier: 'pro', // Adjust based on the plan purchased
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: null, // Will be updated when we fetch subscription details
              });
            
            if (subscriptionError) {
              console.error(`Error creating subscription record: ${subscriptionError.message}`);
            } else {
              console.log(`Created subscription record for user: ${userData.user.id}`);
            }
            
            // Update the subscription metadata with the user ID
            await stripe.subscriptions.update(
              session.subscription,
              {
                metadata: {
                  user_id: userData.user.id
                }
              }
            );
          }
        } else {
          // Handle existing user checkout
          console.log('Handling existing user checkout');
          
          // Get the user ID from the session
          const userId = session.metadata?.user_id;
          
          if (userId && userId !== "pending" && session.subscription) {
            // Add the subscription to the database
            const { error: subscriptionError } = await supabaseAdmin
              .from('user_subscriptions')
              .insert({
                user_id: userId,
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription,
                tier: 'pro', // Adjust based on the plan purchased
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: null, // Will be updated when we fetch subscription details
              });
            
            if (subscriptionError) {
              console.error(`Error creating subscription record: ${subscriptionError.message}`);
            } else {
              console.log(`Created subscription record for user: ${userId}`);
            }
          }
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`Subscription updated: ${subscription.id}`);
        
        // Get the user ID from the subscription metadata
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          // Update the subscription record in the database
          const { error: updateError } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('stripe_subscription_id', subscription.id);
          
          if (updateError) {
            console.error(`Error updating subscription: ${updateError.message}`);
          } else {
            console.log(`Updated subscription for user: ${userId}`);
          }
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`Subscription deleted: ${subscription.id}`);
        
        // Get the user ID from the subscription metadata
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          // Update the subscription record in the database
          const { error: updateError } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              cancel_at_period_end: false,
            })
            .eq('stripe_subscription_id', subscription.id);
          
          if (updateError) {
            console.error(`Error updating subscription: ${updateError.message}`);
          } else {
            console.log(`Marked subscription as canceled for user: ${userId}`);
          }
        }
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
