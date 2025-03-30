
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { createUserAccount, generateRandomPassword, sendWelcomeEmail } from "../_shared/create-user.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Verifying payment for session: ${session_id}`);
    
    // Get Stripe secret key from database
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
      console.error("Stripe secret key not found in database or environment");
      return new Response(
        JSON.stringify({ error: "Payment processing is not configured properly" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Initialize Stripe with the retrieved key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      console.log(`Payment not completed for session: ${session_id}, status: ${session.payment_status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Payment has not been completed" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const customerEmail = session.customer_email || session.metadata?.email;

    if (!customerEmail) {
      console.error("Customer email not found in session");
      return new Response(
        JSON.stringify({ error: "Customer email not found in session" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Verified paid session for email: ${customerEmail}`);

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
        payment_id: session_id,
        payment_provider: "stripe",
        amount: session.amount_total ? session.amount_total / 100 : 0,
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
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
