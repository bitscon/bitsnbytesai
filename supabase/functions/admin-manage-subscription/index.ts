
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, subscription } = await req.json();

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Admin managing subscription: ${action} for user ${userId}`);

    // Handle different actions
    switch (action) {
      case 'create': {
        if (!subscription) {
          return new Response(
            JSON.stringify({ error: "Subscription data is required for create action" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Check if subscription already exists
        const { data: existingSub, error: checkError } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (checkError) {
          console.error(`Error checking existing subscription: ${checkError.message}`);
          return new Response(
            JSON.stringify({ error: "Failed to check existing subscription" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        if (existingSub) {
          console.log(`Subscription already exists for user ${userId}`);
          return new Response(
            JSON.stringify({ 
              message: "Subscription already exists", 
              id: existingSub.id 
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Create new subscription
        const subscriptionData = {
          ...subscription,
          user_id: userId, // Ensure user_id is set correctly
        };

        const { data: newSub, error: createError } = await supabaseAdmin
          .from('user_subscriptions')
          .insert(subscriptionData)
          .select()
          .single();

        if (createError) {
          console.error(`Error creating subscription: ${createError.message}`);
          return new Response(
            JSON.stringify({ error: "Failed to create subscription" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log(`Created subscription for user ${userId}`);
        return new Response(
          JSON.stringify({ 
            message: "Subscription created successfully", 
            subscription: newSub 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case 'update': {
        if (!subscription) {
          return new Response(
            JSON.stringify({ error: "Subscription data is required for update action" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Get subscription ID
        const { data: existingSub, error: fetchError } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (fetchError) {
          console.error(`Error fetching subscription: ${fetchError.message}`);
          return new Response(
            JSON.stringify({ error: "Failed to fetch existing subscription" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        if (!existingSub) {
          console.log(`No subscription found for user ${userId}, creating new one`);
          return await handler(new Request(req.url, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify({ action: 'create', userId, subscription })
          }));
        }

        // Update subscription
        const updateData = { ...subscription };
        delete updateData.id; // Don't try to update the ID
        
        const { data: updatedSub, error: updateError } = await supabaseAdmin
          .from('user_subscriptions')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          console.error(`Error updating subscription: ${updateError.message}`);
          return new Response(
            JSON.stringify({ error: "Failed to update subscription" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log(`Updated subscription for user ${userId}`);
        return new Response(
          JSON.stringify({ 
            message: "Subscription updated successfully", 
            subscription: updatedSub 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case 'delete': {
        // Delete subscription
        const { error: deleteError } = await supabaseAdmin
          .from('user_subscriptions')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error(`Error deleting subscription: ${deleteError.message}`);
          return new Response(
            JSON.stringify({ error: "Failed to delete subscription" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log(`Deleted subscription for user ${userId}`);
        return new Response(
          JSON.stringify({ message: "Subscription deleted successfully" }),
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
    console.error("Error managing subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
