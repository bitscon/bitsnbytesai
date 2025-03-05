
import { supabase } from '@/integrations/supabase/client';
import { handleAuthError, showSuccessToast } from './errorUtils';

export type ToastFunction = (options: { 
  title: string; 
  description: string; 
  variant?: "default" | "destructive" 
}) => void;

export type NavigateFunction = (path: string) => void;

export const handleSignIn = async (
  email: string, 
  password: string, 
  setIsLoading: (loading: boolean) => void,
  toast: ToastFunction,
  navigate: NavigateFunction,
  checkAdminStatus: () => Promise<boolean>
) => {
  setIsLoading(true);
  
  try {
    if (!email || !password) {
      const errorMessage = handleAuthError(
        new Error("Email and password are required"),
        { 
          toast, 
          title: "Login Failed" 
        }
      );
      setIsLoading(false);
      return { error: new Error(errorMessage) };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      console.log("Sign in successful:", data.user?.id);
      
      showSuccessToast(
        toast,
        "Welcome back!",
        "You have successfully logged in."
      );
      
      const isAdmin = await checkAdminStatus();
      console.log("User is admin:", isAdmin);
      
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      
      return { error: null };
    } else {
      handleAuthError(error, { 
        toast, 
        title: "Login Failed" 
      });
      
      return { error };
    }
  } catch (err) {
    handleAuthError(err, { 
      toast, 
      title: "Login Error" 
    });
    
    return { error: err as Error };
  } finally {
    setIsLoading(false);
  }
};
