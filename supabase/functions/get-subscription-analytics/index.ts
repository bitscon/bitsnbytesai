
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authenticateUser } from "./auth.ts";
import { fetchSubscriptionData } from "./analytics.ts";
import { formatResponse } from "./response.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request parameters
    const body = await req.json();
    const { startDate, endDate, period } = body;
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Authenticate the user
    const token = authHeader.replace('Bearer ', '');
    const { user, error: authError, isAdmin } = await authenticateUser(token);
    
    if (authError || !user || !isAdmin) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: !user ? "Invalid token" : "Admin access required" }),
        { status: !user ? 401 : 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse date range
    const end = endDate ? new Date(endDate) : new Date();
    let start = startDate ? new Date(startDate) : new Date(end);
    
    // If period is provided instead of explicit dates, calculate the range
    if (period === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else if (period === 'quarter') {
      start.setMonth(end.getMonth() - 3);
    } else if (period === 'year') {
      start.setFullYear(end.getFullYear() - 1);
    } else if (!startDate) {
      // Default to 1 month if no period or startDate specified
      start.setMonth(end.getMonth() - 1);
    }
    
    // Format dates for SQL queries
    const startDateStr = start.toISOString();
    const endDateStr = end.toISOString();
    
    console.log(`Fetching subscription analytics from ${startDateStr} to ${endDateStr}`);
    
    // Fetch all required data
    const analyticsData = await fetchSubscriptionData(startDateStr, endDateStr);
    
    // Format and return the response
    const response = formatResponse(analyticsData, startDateStr, endDateStr);
    
    return new Response(
      JSON.stringify(response),
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

serve(handler);
