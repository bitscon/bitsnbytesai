
import { supabase } from '@/integrations/supabase/client';
import { ToastFunction, NavigateFunction } from './signInUtils';

export const handleResetPassword = async (
  email: string, 
  setIsLoading: (loading: boolean) => void,
  toast: ToastFunction
) => {
  setIsLoading(true);
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (!error) {
      toast({
        title: "Password reset email sent",
        description: "Please check your email to reset your password.",
      });
    } else {
      console.error("Reset password error:", error);
    }
    
    return { error };
  } catch (err) {
    console.error("Reset password exception:", err);
    return { error: err as Error };
  } finally {
    setIsLoading(false);
  }
};

export const handleUpdatePassword = async (
  newPassword: string, 
  setIsLoading: (loading: boolean) => void,
  toast: ToastFunction,
  navigate: NavigateFunction
) => {
  setIsLoading(true);
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (!error) {
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      navigate('/dashboard');
    } else {
      console.error("Update password error:", error);
    }
    
    return { error };
  } catch (err) {
    console.error("Update password exception:", err);
    return { error: err as Error };
  } finally {
    setIsLoading(false);
  }
};
