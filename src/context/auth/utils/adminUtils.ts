
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const checkAdminStatus = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    console.log("Checking admin status for user ID:", user.id);
    
    // Query the admin_users table directly
    const { data, error } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "row not found" error
      console.error("Error checking admin status:", error);
      return false;
    }
    
    // If data exists, the user is an admin
    const isAdmin = !!data;
    console.log("Admin check result:", isAdmin, "Data:", data);
    
    return isAdmin;
  } catch (err) {
    console.error("Admin check exception:", err);
    return false;
  }
};
