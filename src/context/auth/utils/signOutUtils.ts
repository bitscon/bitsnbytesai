
import { supabase } from '@/integrations/supabase/client';
import { ToastFunction, NavigateFunction } from './signInUtils';

export const handleSignOut = async (
  setIsLoading: (loading: boolean) => void,
  toast: ToastFunction,
  navigate: NavigateFunction
) => {
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
