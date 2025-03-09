
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const checkAdminStatus = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    console.log("Checking admin status for user:", user.id);
    
    // Use the edge function to check admin status
    const { data, error } = await supabase.functions.invoke('check-admin-status', {
      method: 'GET',
    });
    
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
    const isAdmin = data?.is_admin || false;
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
