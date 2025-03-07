
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const checkAdminStatus = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    console.log("Checking admin status for user ID:", user.id);
    
    // Use a direct SQL query to bypass RLS policies
    const { data, error } = await supabase.rpc('is_admin_user', {
      user_id: user.id
    });
    
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
    console.log("Admin check result:", data);
    return !!data;
  } catch (err) {
    console.error("Admin check exception:", err);
    return false;
  }
};
