
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { createUserAccount, generateRandomPassword, sendWelcomeEmail } from "../_shared/create-user.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const getAccessToken = async (): Promise<string> => {
  // Get PayPal settings from database
  const clientId = await getApiSetting("PAYPAL_CLIENT_ID");
  const clientSecret = await getApiSetting("PAYPAL_CLIENT_SECRET");
  const baseUrl = await getApiSetting("PAYPAL_BASE_URL");
  
  if (!clientId || !clientSecret) {
    console.error("PayPal credentials not found in database or environment");
    throw new Error("Payment processing is not configured properly");
  }
  
  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
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
    const { order_id, customer_email } = await req.json();
    
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Capturing PayPal order: ${order_id}`);
    
    const accessToken = await getAccessToken();
    const baseUrl = await getApiSetting("PAYPAL_BASE_URL");
    
    // Capture the PayPal order
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${order_id}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    
    const captureData = await captureResponse.json();
    
    if (captureData.status !== "COMPLETED") {
      console.log(`PayPal capture failed for order: ${order_id}, status: ${captureData.status}`);
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
    
    // Get the customer email from the custom_id field or from the provided customer_email
    let customerEmail = customer_email;
    if (!customerEmail) {
      customerEmail = captureData.purchase_units[0]?.custom_id;
    }
    
    const amount = captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value;
    
    if (!customerEmail) {
      console.error("Customer email not found in order");
      return new Response(
        JSON.stringify({ error: "Customer email not found in order" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Verified PayPal payment for email: ${customerEmail}`);
    
    // Check if user exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(customerEmail);
    
    let userId;
    let isNewUser = false;

    if (existingUser?.user) {
      console.log(`User already exists for email: ${customerEmail}`);
      userId = existingUser.user.id;
    } else {
      // Create a new user account
      console.log(`Creating new user for email: ${customerEmail}`);
      const password = generateRandomPassword();
      const { user, error: userError } = await createUserAccount(customerEmail, password);
      
      if (userError || !user) {
        console.error(`Failed to create user account: ${userError?.message}`);
        throw new Error(userError?.message || "Failed to create user account");
      }
      
      userId = user.id;
      isNewUser = true;

      // Send welcome email with login credentials
      await sendWelcomeEmail(customerEmail, password);
      console.log(`Welcome email sent to: ${customerEmail}`);
    }
    
    // Record the purchase in the database
    console.log(`Recording purchase for user: ${userId}`);
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
    
    console.log(`Purchase recorded successfully: ${data.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        purchase: data,
        isNewUser,
        email: customerEmail
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
