
import { supabase } from '@/integrations/supabase/client';
import { ToastFunction } from './signInUtils';
import { handleAuthError, showSuccessToast } from './errorUtils';

export const handleSignUp = async (
  email: string, 
  password: string, 
  fullName: string,
  setIsLoading: (loading: boolean) => void,
  toast: ToastFunction
) => {
  setIsLoading(true);
  
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (!error) {
      showSuccessToast(
        toast,
        "Verification email sent",
        "Please check your email to verify your account."
      );
      return { error: null };
    } else {
      handleAuthError(error, {
        toast,
        title: "Sign Up Failed",
      });
      
      return { error };
    }
  } catch (err) {
    handleAuthError(err, {
      toast,
      title: "Sign Up Error"
    });
    
    return { error: err as Error };
  } finally {
    setIsLoading(false);
  }
};
