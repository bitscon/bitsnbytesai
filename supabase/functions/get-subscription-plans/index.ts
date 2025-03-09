
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe public key
    const stripePublicKey = await getApiSetting("STRIPE_PUBLIC_KEY");
    
    if (!stripePublicKey) {
      console.error("Stripe public key not found");
      return new Response(
        JSON.stringify({ error: "Payment configuration is incomplete" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all subscription plans
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error(`Error fetching subscription plans: ${error.message}`);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve subscription plans" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        plans,
        stripePublicKey
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error retrieving subscription plans:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
