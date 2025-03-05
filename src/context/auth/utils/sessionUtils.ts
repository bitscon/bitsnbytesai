
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const fetchSession = async (): Promise<{ session: Session | null; user: User | null; error: any | null }> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error fetching session:', error);
      return { session: null, user: null, error };
    }
    
    return { 
      session, 
      user: session?.user || null,
      error: null
    };
  } catch (err) {
    console.error('Session fetch error:', err);
    return { session: null, user: null, error: err };
  }
};

export const setupAuthListener = (callback: (session: Session | null, user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      callback(session, session?.user || null);
    }
  );

  return subscription;
};
