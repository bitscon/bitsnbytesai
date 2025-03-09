
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { createUserAccount, generateRandomPassword, sendWelcomeEmail, createOrUpdateSubscription } from "../_shared/create-user.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify token
    const token = authHeader.replace('Bearer ', '');
    console.log("Got token from Authorization header, verifying...");
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error or no user:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("User authenticated:", user.id, user.email);

    // Check if the user is already an admin or if this is the first user
    const { data: adminCheck, error: adminCheckError } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      console.error("Error checking admin status:", adminCheckError);
    }

    // Check if any admin users exist
    const { count: adminCount, error: countError } = await supabaseAdmin
      .from('admin_users')
      .select('id', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error counting admin users:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to check admin users" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If the user is not an admin and there's at least one admin already, they can't create another admin
    if (!adminCheck && adminCount && adminCount > 0) {
      console.error("Non-admin user attempted to create/promote admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required to create other admins" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Admin check passed, proceeding with operation");

    // Process request based on method
    if (req.method === "POST") {
      const requestData = await req.json();
      const { email, userId, fullName, subscriptionTier, isManualSubscription } = requestData;
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Missing email parameter" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      let targetUserId: string;
      
      // If userId is provided, we're promoting an existing user
      if (userId) {
        console.log(`Promoting existing user with ID ${userId} to admin`);
        targetUserId = userId;
        
        // Log the promotion action
        console.log(`Admin ${user.email} (${user.id}) promoted user with ID ${targetUserId} to admin`);
      } else {
        // Check if the user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
        
        if (!existingUser) {
          const password = generateRandomPassword();
          const { user: newUser, error: createError } = await createUserAccount(email, password, { fullName });
          
          if (createError || !newUser) {
            console.error("Error creating user account:", createError);
            return new Response(
              JSON.stringify({ error: createError?.message || "Failed to create user account" }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          
          targetUserId = newUser.id;
          
          // Set subscription tier if provided
          if (subscriptionTier) {
            console.log(`Setting subscription tier ${subscriptionTier} for new user ${targetUserId}`);
            await createOrUpdateSubscription(targetUserId, subscriptionTier, isManualSubscription);
          }
          
          // Send welcome email
          await sendWelcomeEmail(email, password);
          
          // Log the creation action
          console.log(`Admin ${user.email} (${user.id}) created new user ${email} (${targetUserId}) with subscription tier ${subscriptionTier || 'free'}`);
        } else {
          targetUserId = existingUser.user.id;
          
          // Update subscription tier if provided
          if (subscriptionTier) {
            console.log(`Updating subscription tier to ${subscriptionTier} for existing user ${targetUserId}`);
            await createOrUpdateSubscription(targetUserId, subscriptionTier, isManualSubscription);
          }
          
          // Log the action
          console.log(`Admin ${user.email} (${user.id}) updated existing user ${email} (${targetUserId}) with subscription tier ${subscriptionTier || 'free'}`);
        }
      }
      
      // If request includes making the user an admin
      if (requestData.makeAdmin) {
        console.log(`Making user ${targetUserId} an admin`);
        
        // Make the user an admin
        const { error: adminError } = await supabaseAdmin
          .from('admin_users')
          .upsert({ id: targetUserId })
          .select();
        
        if (adminError) {
          console.error("Error making user an admin:", adminError);
          return new Response(
            JSON.stringify({ error: adminError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        console.log(`Successfully made ${email} (${targetUserId}) an admin`);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User ${email} operation completed successfully`,
          userId: targetUserId 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in create-admin-user:", error);
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
