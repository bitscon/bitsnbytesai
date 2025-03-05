
import { supabase } from '@/integrations/supabase/client';
import { ToastFunction } from './signInUtils';

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
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account.",
      });
      return { error: null };
    } else {
      console.error("Sign up error:", error);
      
      let errorMessage = "Failed to create your account. Please try again.";
      
      if (error.message.includes("email")) {
        errorMessage = "This email is already registered or invalid. Please use a different email.";
      } else if (error.message.includes("password")) {
        errorMessage = "Password is too weak. Please use a stronger password with at least 6 characters.";
      }
      
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { error };
    }
  } catch (err) {
    console.error("Sign up exception:", err);
    
    toast({
      title: "Sign Up Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    
    return { error: err as Error };
  } finally {
    setIsLoading(false);
  }
};
