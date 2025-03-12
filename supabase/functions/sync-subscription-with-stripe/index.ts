
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
    // Verify auth token to ensure this is an admin or the account owner
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get request parameters
    const { userId, subscriptionId, action } = await req.json();
    
    // Check if user is admin or the owner of the subscription
    const isAdmin = await checkIfUserIsAdmin(user.id);
    const isOwner = userId === user.id;
    
    if (!isAdmin && !isOwner) {
      return new Response(
        JSON.stringify({ error: "Unauthorized to perform this action" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Stripe API key
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Handle different actions
    switch (action) {
      case 'sync': {
        const result = await syncSubscriptionWithStripe(userId, stripe);
        return new Response(
          JSON.stringify(result),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      case 'cancel': {
        if (!subscriptionId) {
          return new Response(
            JSON.stringify({ error: "Subscription ID is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        const result = await cancelSubscription(subscriptionId, stripe);
        return new Response(
          JSON.stringify(result),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      case 'reactivate': {
        if (!subscriptionId) {
          return new Response(
            JSON.stringify({ error: "Subscription ID is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        const result = await reactivateSubscription(subscriptionId, stripe);
        return new Response(
          JSON.stringify(result),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Check if user is an admin
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('is_admin_user');
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error("Exception in checkIfUserIsAdmin:", error);
    return false;
  }
}

// Sync a user's subscription with Stripe
async function syncSubscriptionWithStripe(userId: string, stripe: Stripe) {
  try {
    // Get user's subscription from database
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (subscriptionError) {
      throw new Error(`Error fetching subscription: ${subscriptionError.message}`);
    }
    
    // If no subscription found or no Stripe subscription ID, return early
    if (!subscriptionData || !subscriptionData.stripe_subscription_id) {
      return {
        success: false,
        message: "No Stripe subscription found for this user",
        subscription: subscriptionData || null
      };
    }
    
    // Fetch subscription from Stripe
    let stripeSubscription;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id);
    } catch (stripeError) {
      // If subscription not found in Stripe (deleted, etc.), update our records
      if (stripeError.code === 'resource_missing') {
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionData.id);
        
        return {
          success: false,
          message: "Subscription not found in Stripe, marked as canceled",
          subscription: {
            ...subscriptionData,
            status: 'canceled',
            ended_at: new Date().toISOString()
          }
        };
      }
      
      throw stripeError;
    }
    
    // Update our database with latest Stripe data
    const updatedSubscription = {
      status: stripeSubscription.status,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      cancel_at: stripeSubscription.cancel_at ? new Date(stripeSubscription.cancel_at * 1000).toISOString() : null,
      ended_at: stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000).toISOString() : null,
      trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
      trial_start: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    };
    
    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update(updatedSubscription)
      .eq('id', subscriptionData.id);
    
    if (updateError) {
      throw new Error(`Error updating subscription: ${updateError.message}`);
    }
    
    return {
      success: true,
      message: "Subscription synced with Stripe",
      subscription: {
        ...subscriptionData,
        ...updatedSubscription
      }
    };
  } catch (error) {
    console.error("Error in syncSubscriptionWithStripe:", error);
    throw error;
  }
}

// Cancel subscription in Stripe
async function cancelSubscription(subscriptionId: string, stripe: Stripe) {
  try {
    // First check if subscription exists in Stripe
    let stripeSubscription;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    } catch (stripeError) {
      if (stripeError.code === 'resource_missing') {
        // Update our database to mark it as canceled
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);
        
        return {
          success: false,
          message: "Subscription not found in Stripe, marked as canceled locally"
        };
      }
      
      throw stripeError;
    }
    
    // If already canceled, return early
    if (stripeSubscription.status === 'canceled') {
      return {
        success: true,
        message: "Subscription is already canceled",
        subscription: stripeSubscription
      };
    }
    
    // Cancel at period end
    const canceled = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    // Update our database
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        cancel_at: canceled.cancel_at ? new Date(canceled.cancel_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);
    
    return {
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
      subscription: canceled
    };
  } catch (error) {
    console.error("Error in cancelSubscription:", error);
    throw error;
  }
}

// Reactivate subscription in Stripe
async function reactivateSubscription(subscriptionId: string, stripe: Stripe) {
  try {
    // First check if subscription exists in Stripe
    let stripeSubscription;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    } catch (stripeError) {
      if (stripeError.code === 'resource_missing') {
        return {
          success: false,
          message: "Subscription not found in Stripe"
        };
      }
      
      throw stripeError;
    }
    
    // If not set to cancel at period end, return early
    if (!stripeSubscription.cancel_at_period_end) {
      return {
        success: true,
        message: "Subscription is not scheduled for cancellation",
        subscription: stripeSubscription
      };
    }
    
    // Reactivate subscription
    const reactivated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
    
    // Update our database
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: false,
        cancel_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);
    
    return {
      success: true,
      message: "Subscription reactivated successfully",
      subscription: reactivated
    };
  } catch (error) {
    console.error("Error in reactivateSubscription:", error);
    throw error;
  }
}

serve(handler);
