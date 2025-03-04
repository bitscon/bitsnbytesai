
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") || "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
const PAYPAL_BASE_URL = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";

const getAccessToken = async (): Promise<string> => {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });
  
  const data = await response.json();
  return data.access_token;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { order_id } = await req.json();
    
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const accessToken = await getAccessToken();
    
    // Capture the PayPal order
    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${order_id}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    
    const captureData = await captureResponse.json();
    
    if (captureData.status !== "COMPLETED") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Payment capture failed",
          details: captureData 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get the user ID from the custom_id field
    const userId = captureData.purchase_units[0]?.custom_id;
    const amount = captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID not found in order" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Record the purchase in the database
    const { data, error } = await supabaseAdmin
      .from("user_purchases")
      .insert({
        user_id: userId,
        payment_id: order_id,
        payment_provider: "paypal",
        amount: parseFloat(amount || "0"),
        status: "completed",
        product_id: "ai_prompts",
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error recording purchase:", error);
      return new Response(
        JSON.stringify({ error: "Failed to record purchase" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        purchase: data 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
