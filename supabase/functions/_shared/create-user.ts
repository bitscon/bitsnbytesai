
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
