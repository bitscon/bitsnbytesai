import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          throw error;
        }
        
        setSession(session);
        setUser(session?.user || null);
      } catch (err) {
        console.error('Session fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
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

  const signIn = async (email: string, password: string) => {
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

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
        toast({
          title: "Error signing out",
          description: "There was a problem signing out. Please try again.",
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Signed out",
        description: "You have successfully signed out.",
      });
      
      navigate('/');
      return { error: null };
    } catch (err) {
      console.error("Sign out exception:", err);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
      return { error: err as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
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

  const updatePassword = async (newPassword: string) => {
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

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log("Checking admin status for user ID:", user.id);
      
      const { data, error } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      
      const isAdmin = !!data;
      console.log("Admin check result:", isAdmin, "Data:", data);
      
      return isAdmin;
    } catch (err) {
      console.error("Admin check exception:", err);
      return false;
    }
  };

  return {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    checkAdminStatus,
  };
}
