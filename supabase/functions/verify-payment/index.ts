
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { createUserAccount } from "../_shared/create-user.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

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

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
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
      return new Response(
        JSON.stringify({ error: "Customer email not found in session" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(customerEmail);
    
    let userId;
    let isNewUser = false;

    if (existingUser?.user) {
      userId = existingUser.user.id;
    } else {
      // Create a new user account
      const password = generateRandomPassword();
      const { user, error: userError } = await createUserAccount(customerEmail, password);
      
      if (userError || !user) {
        throw new Error(userError?.message || "Failed to create user account");
      }
      
      userId = user.id;
      isNewUser = true;

      // Send welcome email with login credentials
      await sendWelcomeEmail(customerEmail, password);
    }

    // Record the purchase in the database
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

function generateRandomPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

async function sendWelcomeEmail(email: string, password: string): Promise<void> {
  // In a real implementation, you would use a service like SendGrid, Resend, etc.
  console.log(`Sending welcome email to ${email} with password ${password}`);
  
  // Simulate sending an email - this is a placeholder
  // In a production app, you would need to implement proper email sending
  console.log("Welcome email content:");
  console.log(`
    Subject: Your AI Prompts Library Account is Ready
    
    Hello and welcome to AI Prompts Library!
    
    Your account has been created successfully. Here are your login details:
    
    Email: ${email}
    Password: ${password}
    
    Please login at: ${Deno.env.get("APP_URL") || "https://your-app-url.com"}/login
    
    For security reasons, we recommend changing your password after your first login.
    
    Thank you for your purchase. You now have full access to our premium AI prompts.
    
    Best regards,
    The AI Prompts Library Team
  `);
}

serve(handler);
