
import { supabase } from '@/integrations/supabase/client';

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
      toast({
        title: "Login Failed",
        description: "Please provide both email and password.",
        variant: "destructive",
      });
      setIsLoading(false);
      return { error: new Error("Email and password are required") };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      console.log("Sign in successful:", data.user?.id);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      const isAdmin = await checkAdminStatus();
      console.log("User is admin:", isAdmin);
      
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      
      return { error: null };
    } else {
      console.error("Sign in error:", error);
      
      let errorMessage = "Invalid email or password. Please try again.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "The email or password you entered is incorrect. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please verify your email before signing in. Check your inbox for a verification link.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { error };
    }
  } catch (err) {
    console.error("Sign in exception:", err);
    
    toast({
      title: "Login Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    
    return { error: err as Error };
  } finally {
    setIsLoading(false);
  }
};
