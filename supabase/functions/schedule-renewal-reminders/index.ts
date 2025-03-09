
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

// This function will be called by a cron job to schedule renewal reminders
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Scheduling renewal reminder emails");
    
    // Schedule reminders for 3 days before renewal
    const response3Days = await fetch(`${new URL(req.url).origin}/functions/v1/send-renewal-reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({ daysBeforeRenewal: 3 })
    });
    
    const result3Days = await response3Days.json();
    
    // Schedule reminders for 1 day before renewal
    const response1Day = await fetch(`${new URL(req.url).origin}/functions/v1/send-renewal-reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({ daysBeforeRenewal: 1 })
    });
    
    const result1Day = await response1Day.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results: {
          "3days": result3Days,
          "1day": result1Day
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error scheduling renewal reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
