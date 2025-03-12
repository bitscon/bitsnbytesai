
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Base function to invoke Supabase edge functions with error handling
 */
export async function invokeSupabaseFunction(
  functionName: string,
  body: any
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    
    if (error) {
      console.error(`Error invoking ${functionName}:`, error);
      return { success: false, message: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error(`Error in invokeSupabaseFunction (${functionName}):`, error);
    return { success: false, message: error.message };
  }
}

/**
 * Handles user-facing error feedback via toast messages
 */
export function handlePaymentError(
  errorMessage: string,
  defaultMessage: string = 'An unexpected error occurred'
): void {
  toast({
    title: 'Error',
    description: errorMessage || defaultMessage,
    variant: 'destructive',
  });
}

/**
 * Stores temporary session data for payment flows
 */
export function storeSessionData(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.error('Failed to store session data:', error);
  }
}

/**
 * Retrieves temporary session data for payment flows
 */
export function getSessionData(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.error('Failed to retrieve session data:', error);
    return null;
  }
}

/**
 * Clears temporary session data for payment flows
 */
export function clearSessionData(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear session data:', error);
  }
}
