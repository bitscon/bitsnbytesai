
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getAllApiSettings, updateApiSetting, ensurePayPalSettings } from "../_shared/api-settings.ts";

// Utility function to check if user is an admin
async function isAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
    
  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
  
  return !!data;
}

// Process API settings to add metadata and has_value flag
function processApiSettings(settings: any[]) {
  return settings.map(setting => {
    const isSecret = setting.key_name.includes('SECRET') || 
                    setting.key_name.includes('KEY') ||
                    setting.key_name.includes('PASSWORD');
    
    // Determine provider from key name
    let provider = 'unknown';
    if (setting.key_name.startsWith('STRIPE_')) provider = 'stripe';
    if (setting.key_name.startsWith('PAYPAL_')) provider = 'paypal';
    if (setting.key_name.startsWith('RESEND_')) provider = 'resend';
    
    // Determine environment from key name or value pattern
    let environment = undefined;
    if (setting.key_name.includes('_TEST') || 
        setting.key_name.includes('_SANDBOX')) {
      environment = 'test';
    } else if (setting.key_name.includes('_LIVE') || 
              setting.key_name.includes('_PRODUCTION')) {
      environment = 'production';
    } else if (setting.key_value && setting.key_value.includes('test')) {
      environment = 'test';
    } else if (setting.key_value && setting.key_value.includes('live')) {
      environment = 'production';
    }
    
    return {
      ...setting,
      has_value: !!setting.key_value && setting.key_value.trim() !== "",
      is_secret: isSecret,
      provider,
      environment
    };
  });
}

// Log administrative actions
async function logAdminAction(userId: string, action: string, details: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        user_id: userId,
        action_type: action,
        details: details,
        ip_address: "Unknown" // In a real app, you'd capture this from the request
      });
  } catch (error) {
    console.error("Error logging admin action:", error);
    // Non-blocking - don't throw, just log the error
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Admin API Settings function called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    console.log("Got token from Authorization header, verifying...");
    
    // Manually verify the JWT token rather than using getUser
    try {
      // Decode the JWT to get the user ID
      const { sub } = decodeJwt(token);
      if (!sub) {
        throw new Error("Invalid token: Missing subject (user ID)");
      }
      
      console.log("Decoded user ID from token:", sub);
      
      // Check if user is admin directly
      const admin = await isAdmin(sub);
      console.log("Is admin:", admin);
      
      if (!admin) {
        return new Response(
          JSON.stringify({ error: "Forbidden. Admin access required." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Ensure necessary settings exist
      await ensurePayPalSettings();
      
      if (req.method === "GET") {
        console.log("Fetching all API settings");
        // Get all API settings
        const settings = await getAllApiSettings();
        
        // Process settings to add metadata and has_value flag
        const processedSettings = processApiSettings(settings);
        
        return new Response(
          JSON.stringify({ settings: processedSettings }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        
      } else if (req.method === "POST") {
        // Get request body
        const requestBody = await req.json();
        const { key_name, key_value, metadata, action } = requestBody;
        console.log("Updating API setting:", key_name, action || "update");
        
        if (!key_name) {
          return new Response(
            JSON.stringify({ error: "Missing required field: key_name" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Handle different actions
        if (action === 'renew') {
          // For key renewal, update metadata (expiry, renewal date)
          console.log("Renewing key:", key_name);
          await logAdminAction(sub, "RENEW_API_KEY", `Renewed API key: ${key_name}`);
          
          const { error } = await supabaseAdmin
            .from('api_settings')
            .update({
              metadata: metadata || {}
            })
            .eq('key_name', key_name);
          
          if (error) {
            console.error("Error renewing API key:", error);
            return new Response(
              JSON.stringify({ error: "Failed to renew API key" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({ success: true, message: "API key renewed successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
          
        } else if (metadata) {
          // Update just the metadata (like expiry date)
          console.log("Updating API setting metadata:", key_name);
          await logAdminAction(sub, "UPDATE_API_KEY_METADATA", `Updated metadata for: ${key_name}`);
          
          const { error } = await supabaseAdmin
            .from('api_settings')
            .update({
              metadata: metadata
            })
            .eq('key_name', key_name);
          
          if (error) {
            console.error("Error updating API setting metadata:", error);
            return new Response(
              JSON.stringify({ error: "Failed to update API setting metadata" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
          
        } else {
          // Regular update of key value
          console.log("Updating API setting value:", key_name);
          await logAdminAction(sub, "UPDATE_API_KEY", `Updated API key: ${key_name}`);
          
          const success = await updateApiSetting(key_name, key_value || "");
          
          if (!success) {
            return new Response(
              JSON.stringify({ error: "Failed to update API setting" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (tokenError) {
      console.error("Error processing token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token", details: tokenError.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
  } catch (error) {
    console.error("Error in admin-api-settings function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

// Simple JWT token decoder
function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      throw new Error("Invalid token format");
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decoding JWT:", e);
    throw new Error("Failed to decode JWT token");
  }
}

serve(handler);
