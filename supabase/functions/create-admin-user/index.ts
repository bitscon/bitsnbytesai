import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { createUserAccount, generateRandomPassword, sendWelcomeEmail, createOrUpdateSubscription } from "../_shared/create-user.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Error in create-admin-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Add to the handler function to handle subscription tier assignment
async function handleRequest(req: Request): Promise<Response> {
  try {
    // Verify the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Invalid Authorization header format" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const { userId, email, fullName, password, makeAdmin, subscriptionTier, isManualSubscription } = await req.json();
    
    let userToMakeAdmin;
    
    if (userId) {
      // Get the user from Supabase Auth
      const { data: existingUser, error: existingUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (existingUserError) {
        throw new Error(`Error getting user: ${existingUserError.message}`);
      }
      
      userToMakeAdmin = existingUser.user;
    } else if (email) {
      // Creating a new user with the provided email
      let userPassword = password;
      
      if (!userPassword) {
        userPassword = generateRandomPassword();
      }
      
      const { user, error: createUserError } = await createUserAccount(email, userPassword, { fullName });
      
      if (createUserError) {
        throw new Error(`Error creating user: ${createUserError.message}`);
      }
      
      userToMakeAdmin = user;
      
      // Send welcome email only if we generated a password
      if (!password) {
        await sendWelcomeEmail(email, userPassword);
      }
    } else {
      throw new Error("Either userId or email must be provided");
    }
    
    // Make the user an admin if requested
    if (makeAdmin && userToMakeAdmin) {
      const { error: adminError } = await supabaseAdmin
        .from('admin_users')
        .upsert({ 
          id: userToMakeAdmin.id 
        }, { 
          onConflict: 'id' 
        });
      
      if (adminError) {
        throw new Error(`Error setting admin status: ${adminError.message}`);
      }
    }
    
    // Handle subscription tier assignment if provided
    if (userToMakeAdmin && subscriptionTier && isManualSubscription) {
      const { success, error: subscriptionError } = await createOrUpdateSubscription(
        userToMakeAdmin.id,
        subscriptionTier,
        true // Set is_manually_created to true
      );
      
      if (!success && subscriptionError) {
        throw new Error(`Error setting subscription: ${subscriptionError.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: userId ? "User updated successfully" : "User created successfully",
        userId: userToMakeAdmin?.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}
