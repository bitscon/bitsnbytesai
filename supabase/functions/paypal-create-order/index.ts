
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const getAccessToken = async (clientId: string, clientSecret: string, baseUrl: string): Promise<string> => {
  const auth = btoa(`${clientId}:${clientSecret}`);
  
  console.log(`Getting PayPal access token from ${baseUrl}/v1/oauth2/token`);
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to get PayPal access token: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`PayPal authentication failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log("Successfully obtained PayPal access token");
  return data.access_token;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { amount, email, returnUrl, cancelUrl } = await req.json();
    
    if (!amount || !email) {
      return new Response(
        JSON.stringify({ error: "Amount and email are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Creating PayPal order for ${email} with amount ${amount}`);
    console.log(`Return URL: ${returnUrl}, Cancel URL: ${cancelUrl}`);
    
    // Get PayPal settings from database
    const clientId = await getApiSetting("PAYPAL_CLIENT_ID");
    const clientSecret = await getApiSetting("PAYPAL_CLIENT_SECRET");
    const baseUrl = await getApiSetting("PAYPAL_BASE_URL");
    
    console.log(`PayPal configuration: baseUrl=${baseUrl}, clientId=${clientId ? "configured" : "missing"}, clientSecret=${clientSecret ? "configured" : "missing"}`);
    
    if (!clientId || !clientSecret) {
      console.error("PayPal credentials not found in database or environment");
      return new Response(
        JSON.stringify({ error: "Payment processing is not configured properly" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get PayPal access token
    const accessToken = await getAccessToken(clientId, clientSecret, baseUrl);
    
    console.log(`Creating order at ${baseUrl}/v2/checkout/orders`);
    
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toString(),
          },
          custom_id: email,
        },
      ],
      application_context: {
        brand_name: "AI Prompts Library",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };
    
    console.log("PayPal order payload:", JSON.stringify(orderPayload));
    
    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PayPal create order failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`PayPal create order failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("PayPal order created successfully:", data.id);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
