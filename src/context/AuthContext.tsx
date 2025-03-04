
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: any | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
      }
      
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    setIsLoading(false);
    
    if (!error) {
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account.",
      });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    setIsLoading(false);
    
    if (!error) {
      navigate('/dashboard');
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    setIsLoading(false);
    
    if (!error) {
      toast({
        title: "Password reset email sent",
        description: "Please check your email to reset your password.",
      });
    }
    
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    setIsLoading(false);
    
    if (!error) {
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      navigate('/dashboard');
    }
    
    return { error };
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
