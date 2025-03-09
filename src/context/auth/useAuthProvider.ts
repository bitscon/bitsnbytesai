
import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { fetchSession, setupAuthListener } from './utils/sessionUtils';
import { handleSignIn } from './utils/signInUtils';
import { handleSignOut } from './utils/signOutUtils';
import { handleResetPassword, handleUpdatePassword } from './utils/passwordUtils';
import { checkAdminStatus as checkUserAdminStatus } from './utils/adminUtils';

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { session, user, error } = await fetchSession();
        
        if (error) {
          console.error('Error initializing session:', error);
        }
        
        setSession(session);
        setUser(user);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();

    const subscription = setupAuthListener((session, user) => {
      setSession(session);
      setUser(user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return handleSignIn(
      email, 
      password, 
      setIsLoading, 
      toast, 
      navigate, 
      async () => checkUserAdminStatus(user)
    );
  };

  const signOut = async () => {
    return handleSignOut(setIsLoading, toast, navigate);
  };

  const resetPassword = async (email: string) => {
    return handleResetPassword(email, setIsLoading, toast);
  };

  const updatePassword = async (newPassword: string) => {
    return handleUpdatePassword(newPassword, setIsLoading, toast, navigate);
  };

  const checkAdminStatus = async (): Promise<boolean> => {
    return checkUserAdminStatus(user);
  };

  const isLoggedIn = !!user && !!session;

  return {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    checkAdminStatus,
    isLoggedIn,
  };
}
