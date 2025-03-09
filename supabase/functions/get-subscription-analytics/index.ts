
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request to get date range
    const { startDate, endDate } = await req.json();
    
    // Validate admin access using auth header
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
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin_user');
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Set default date range if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    start.setMonth(start.getMonth() - 1); // Default to 1 month period
    
    // Format dates for SQL queries
    const startDateStr = start.toISOString();
    const endDateStr = end.toISOString();
    
    console.log(`Fetching subscription analytics from ${startDateStr} to ${endDateStr}`);
    
    // 1. Total subscriptions by tier
    const { data: tierDistribution, error: tierError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('tier, count')
      .eq('tier', 'free')
      .order('tier')
      .group('tier');
    
    if (tierError) {
      console.error("Error fetching tier distribution:", tierError);
    }
    
    // 2. New subscriptions over time
    const { data: newSubscriptions, error: newSubError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('created_at, tier')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at');
    
    if (newSubError) {
      console.error("Error fetching new subscriptions:", newSubError);
    }
    
    // 3. Subscription changes (upgrades/downgrades)
    // For real metrics, we would need a subscription_history table to track changes
    // This is a simplified version using logs from recent webhook events
    const { data: recentChanges, error: changesError } = await supabaseAdmin
      .from('subscription_events')
      .select('event_type, created_at, old_tier, new_tier')
      .in('event_type', ['upgrade', 'downgrade', 'cancel'])
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: false });
    
    // For demo purposes, generate some placeholder data if the subscription_events table doesn't exist
    let subscriptionChanges = recentChanges;
    if (changesError) {
      console.log("Subscription events table may not exist, using placeholder data");
      subscriptionChanges = [];
    }
    
    // 4. Payment failures
    // Fetch from a payment_failures table or webhook logs
    const { data: paymentFailures, error: failuresError } = await supabaseAdmin
      .from('payment_failures')
      .select('created_at, reason, resolved')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: false });
    
    // Generate placeholder data if table doesn't exist
    let failures = paymentFailures;
    if (failuresError) {
      console.log("Payment failures table may not exist, using placeholder data");
      failures = [];
    }
    
    // 5. Current active subscriptions
    const { data: activeSubscriptions, error: activeError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('tier, count')
      .neq('tier', 'free')
      .group('tier');
    
    if (activeError) {
      console.error("Error fetching active subscriptions:", activeError);
    }
    
    // Check if we need to create the analytics tables first
    if (changesError && failuresError) {
      // We're likely missing the analytics tables, let's create them
      try {
        await createAnalyticsTables();
      } catch (error) {
        console.error("Error creating analytics tables:", error);
      }
    }
    
    // Return all analytics data
    return new Response(
      JSON.stringify({
        tierDistribution: tierDistribution || [],
        newSubscriptions: newSubscriptions || [],
        subscriptionChanges: subscriptionChanges || [],
        paymentFailures: failures || [],
        activeSubscriptions: activeSubscriptions || [],
        period: {
          start: startDateStr,
          end: endDateStr
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error retrieving subscription analytics:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Helper function to create required analytics tables if they don't exist
async function createAnalyticsTables() {
  // Create subscription_events table for tracking changes
  await supabaseAdmin.rpc('create_subscription_events_if_not_exists');
  
  // Create payment_failures table
  await supabaseAdmin.rpc('create_payment_failures_if_not_exists');
  
  console.log("Created analytics tables");
}

serve(handler);
