
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { CREATE_SUBSCRIPTION_EVENTS_FUNCTION, CREATE_PAYMENT_FAILURES_FUNCTION } from "../_shared/sql-scripts.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access using auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if the user is an admin
    const { data: adminCheck, error: adminError } = await supabaseAdmin.rpc('is_admin', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (adminError || !adminCheck) {
      console.error("Admin check error:", adminError);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create required tables and functions using RPC
    await supabaseAdmin.rpc('create_subscription_events_if_not_exists');
    await supabaseAdmin.rpc('create_payment_failures_if_not_exists');
    
    // Add stripe_product_id column to subscription_plans if it doesn't exist
    const { error: alterError } = await supabaseAdmin.rpc('execute_sql', {
      sql_statement: `
        ALTER TABLE IF EXISTS public.subscription_plans 
        ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
      `
    });
    
    if (alterError) {
      console.error("Error adding stripe_product_id column:", alterError);
      return new Response(
        JSON.stringify({ error: "Schema update failed", details: alterError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ message: "Schema updated successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating schema:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
