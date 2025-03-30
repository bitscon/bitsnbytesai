
import { supabaseAdmin } from "./supabase-admin.ts";

interface ApiSetting {
  key_name: string;
  key_value: string;
  description?: string;
}

export async function getApiSetting(keyName: string): Promise<string> {
  try {
    console.log(`Retrieving API setting: ${keyName}`);
    
    const { data, error } = await supabaseAdmin
      .from('api_settings')
      .select('key_value')
      .eq('key_name', keyName)
      .single();
    
    if (error) {
      console.error(`Error retrieving API setting ${keyName}:`, error);
      // Fallback to environment variable if database retrieval fails
      const envValue = Deno.env.get(keyName);
      return envValue || "";
    }
    
    return data?.key_value || "";
  } catch (error) {
    console.error(`Exception retrieving API setting ${keyName}:`, error);
    // Fallback to environment variable if exception occurs
    const envValue = Deno.env.get(keyName);
    return envValue || "";
  }
}

export async function getAllApiSettings(): Promise<ApiSetting[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_settings')
      .select('key_name, key_value, description')
      .order('key_name');
    
    if (error) {
      console.error("Error retrieving all API settings:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Exception retrieving all API settings:", error);
    return [];
  }
}

export async function updateApiSetting(keyName: string, keyValue: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('api_settings')
      .update({ key_value: keyValue })
      .eq('key_name', keyName);
    
    if (error) {
      console.error(`Error updating API setting ${keyName}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Exception updating API setting ${keyName}:`, error);
    return false;
  }
}

export async function createApiSettingIfNotExists(
  keyName: string, 
  defaultValue: string = "", 
  description: string = ""
): Promise<boolean> {
  try {
    // Check if setting already exists
    const { data, error: checkError } = await supabaseAdmin
      .from('api_settings')
      .select('key_name')
      .eq('key_name', keyName)
      .maybeSingle();
    
    if (checkError) {
      console.error(`Error checking if API setting ${keyName} exists:`, checkError);
      return false;
    }
    
    // If setting doesn't exist, create it
    if (!data) {
      const { error: insertError } = await supabaseAdmin
        .from('api_settings')
        .insert({
          key_name: keyName,
          key_value: defaultValue,
          description: description
        });
      
      if (insertError) {
        console.error(`Error creating API setting ${keyName}:`, insertError);
        return false;
      }
      
      console.log(`Created API setting: ${keyName}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Exception creating API setting ${keyName}:`, error);
    return false;
  }
}

export async function ensurePayPalSettings(): Promise<void> {
  await createApiSettingIfNotExists(
    "PAYPAL_CLIENT_ID", 
    "", 
    "Your PayPal Client ID from the PayPal Developer Dashboard"
  );
  
  await createApiSettingIfNotExists(
    "PAYPAL_CLIENT_SECRET", 
    "", 
    "Your PayPal Client Secret from the PayPal Developer Dashboard"
  );
  
  await createApiSettingIfNotExists(
    "PAYPAL_BASE_URL", 
    "https://api-m.sandbox.paypal.com", 
    "PayPal API base URL (sandbox or live)"
  );
}
