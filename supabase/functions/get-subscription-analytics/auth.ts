
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

/**
 * Authenticates a user and verifies admin status
 */
export async function authenticateUser(token: string) {
  // Verify the token and get the user
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  
  if (userError || !user) {
    return { user: null, error: userError, isAdmin: false };
  }
  
  // Check if the user is an admin by directly querying the admin_users table
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  
  const isAdmin = !!adminData;
  
  if (adminError) {
    return { user, error: adminError, isAdmin: false };
  }
  
  return { user, error: null, isAdmin };
}
