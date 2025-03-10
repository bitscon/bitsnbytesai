
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

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
      
      // Add additional logging for admin activities
      await supabase.from('subscription_events').insert({
        user_id: user.id,
        event_type: 'admin_login',
        metadata: {
          email: user.email,
          timestamp: new Date().toISOString()
        }
      }).then(({ error }) => {
        if (error) console.error("Error logging admin login:", error);
      });
    } else {
      console.log("Admin access check failed for user:", user.id, user.email);
    }
    
    return isAdmin;
  } catch (err) {
    console.error("Admin check exception:", err);
    return false;
  }
};

/**
 * Helper function to handle admin operations on subscriptions
 * This ensures all admin operations respect the RLS policies
 */
export const performAdminSubscriptionOperation = async (
  operation: 'create' | 'update' | 'delete',
  subscriptionData: any,
  userId?: string
): Promise<{success: boolean, error?: string, data?: any}> => {
  try {
    if (operation === 'create') {
      const { data, error } = await supabase.functions.invoke('admin-manage-subscription', {
        body: {
          action: 'create',
          userId: userId || subscriptionData.user_id,
          subscription: subscriptionData
        }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    }
    
    if (operation === 'update') {
      const { data, error } = await supabase.functions.invoke('admin-manage-subscription', {
        body: {
          action: 'update',
          userId: userId || subscriptionData.user_id,
          subscription: subscriptionData
        }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    }
    
    if (operation === 'delete') {
      const { data, error } = await supabase.functions.invoke('admin-manage-subscription', {
        body: {
          action: 'delete',
          userId: userId || subscriptionData.user_id
        }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    }
    
    return { success: false, error: 'Invalid operation' };
  } catch (err) {
    console.error('Error in performAdminSubscriptionOperation:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
};
