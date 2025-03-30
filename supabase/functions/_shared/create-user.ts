
import { supabaseAdmin } from "./supabase-admin.ts";

interface CreateUserResult {
  user: {
    id: string;
    email: string;
  } | null;
  error: Error | null;
}

export async function createUserAccount(
  email: string,
  password: string
): Promise<CreateUserResult> {
  try {
    console.log(`Creating user account for email: ${email}`);
    
    // Create the user account
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { full_name: "AI Prompts Customer" }
    });

    if (error) {
      console.error("Error creating user account:", error);
      return { user: null, error };
    }

    console.log(`User account created successfully for: ${email}`);
    
    return { 
      user: { 
        id: data.user.id, 
        email: data.user.email || email 
      }, 
      error: null 
    };
  } catch (error) {
    console.error("Error in createUserAccount:", error);
    return { user: null, error: error as Error };
  }
}

// Function to generate a random password
export function generateRandomPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Function to send welcome email with login credentials
export async function sendWelcomeEmail(email: string, password: string): Promise<void> {
  // In a real implementation, you would use a service like SendGrid, Resend, etc.
  console.log(`Sending welcome email to ${email}`);
  
  // Log the email content for debugging
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
