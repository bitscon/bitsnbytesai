
import { supabase } from '@/integrations/supabase/client';
import { ToastFunction, NavigateFunction } from './signInUtils';
import { handleAuthError, showSuccessToast } from './errorUtils';

export const handleSignOut = async (
  setIsLoading: (loading: boolean) => void,
  toast: ToastFunction,
  navigate: NavigateFunction
) => {
  try {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      handleAuthError(error, {
        toast,
        title: "Error signing out",
        defaultMessage: "There was a problem signing out. Please try again."
      });
      return { error };
    }
    
    showSuccessToast(
      toast,
      "Signed out",
      "You have successfully signed out."
    );
    
    navigate('/');
    return { error: null };
  } catch (err) {
    handleAuthError(err, {
      toast,
      title: "Error signing out",
      defaultMessage: "There was a problem signing out. Please try again."
    });
    return { error: err as Error };
  } finally {
    setIsLoading(false);
  }
};
