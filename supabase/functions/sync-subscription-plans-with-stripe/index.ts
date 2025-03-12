
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";
import { syncPlansToStripe } from "./services/syncToStripe.ts";
import { syncPlansFromStripe } from "./services/syncFromStripe.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth token to ensure this is an admin
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

    // Check if user is an admin by directly querying the admin_users table
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    const isAdmin = !!adminData;
    
    if (adminError || !isAdmin) {
      console.error("Admin check error:", adminError);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
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

    // Get request parameters
    const { direction = 'both' } = await req.json() || {};
    
    let result = {};
    
    if (direction === 'to_stripe' || direction === 'both') {
      // Sync our plans to Stripe
      const toStripeResult = await syncPlansToStripe(stripeSecretKey);
      result = { ...result, to_stripe: toStripeResult };
    }
    
    if (direction === 'from_stripe' || direction === 'both') {
      // Sync Stripe products to our plans
      const fromStripeResult = await syncPlansFromStripe(stripeSecretKey);
      result = { ...result, from_stripe: fromStripeResult };
    }

    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

serve(handler);
