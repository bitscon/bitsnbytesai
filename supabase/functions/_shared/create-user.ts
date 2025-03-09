
import { supabaseAdmin } from "./supabase-admin.ts";
import { generateEmailTemplate } from "./email-templates.ts";

// Generate a random secure password
export function generateRandomPassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Create a new user account
export async function createUserAccount(email: string, password: string, userData?: { fullName?: string }) {
  try {
    console.log(`Creating user account for ${email}`);
    
    // Create the user in Auth
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: userData?.fullName || email.split('@')[0] 
      }
    });
    
    if (error) {
      console.error("Error creating user:", error);
      return { user: null, error };
    }
    
    console.log(`User created successfully: ${user.user.id}`);
    return { user: user.user, error: null };
  } catch (error) {
    console.error("Error in createUserAccount:", error);
    return { user: null, error };
  }
}

// Create or update a user subscription
export async function createOrUpdateSubscription(userId: string, tier: string, isManuallyCreated: boolean = false) {
  try {
    console.log(`Setting up subscription for user ${userId} with tier ${tier}, manually created: ${isManuallyCreated}`);
    
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier: tier,
        is_manually_created: isManuallyCreated,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error("Error setting up subscription:", error);
      throw error;
    }
    
    console.log(`Subscription successfully set for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error in createOrUpdateSubscription:", error);
    return { success: false, error };
  }
}

// Send welcome email to new user
export async function sendWelcomeEmail(email: string, password: string) {
  try {
    console.log(`Sending welcome email to ${email}`);
    
    // In a real implementation, you would use an email service like SendGrid, Mailgun, etc.
    // For demonstration, we'll just log the email content
    const emailContent = generateEmailTemplate({
      type: "welcome",
      data: {
        email,
        password,
        loginUrl: "https://yourapp.com/login"
      }
    });
    
    console.log("Email content:", emailContent);
    console.log(`Welcome email would be sent to ${email} with password ${password}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}
