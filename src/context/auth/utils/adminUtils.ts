
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const checkAdminStatus = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    console.log("Checking admin status for user ID:", user.id);
    
    // Use a direct SQL query to bypass RLS policies
    const { data, error } = await supabase.rpc('is_admin_user');
    
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
    const isAdmin = !!data;
    console.log("Admin check result:", isAdmin);
    
    // For audit purposes, log admin access attempts
    if (isAdmin) {
      console.log("Admin access verified for user:", user.id, user.email);
    } else {
      console.log("Admin access check failed for user:", user.id, user.email);
    }
    
    return isAdmin;
  } catch (err) {
    console.error("Admin check exception:", err);
    return false;
  }
};
