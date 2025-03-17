
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseErrorHandlingOptions {
  errorTitle?: string;
  defaultErrorMessage?: string;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const { 
    errorTitle = 'An error occurred', 
    defaultErrorMessage = 'An unexpected error occurred. Please try again.' 
  } = options;
  
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleError = (error: any, customTitle?: string, customMessage?: string) => {
    console.error('Error:', error);
    
    const errorObj = error instanceof Error ? error : new Error(error?.message || defaultErrorMessage);
    setError(errorObj);
    
    toast({
      title: customTitle || errorTitle,
      description: customMessage || error?.message || defaultErrorMessage,
      variant: 'destructive',
    });
    
    return errorObj;
  };

  const clearError = () => {
    setError(null);
  };

  const withErrorHandling = async <T,>(
    asyncFn: () => Promise<T>,
    loadingState: boolean = true,
    customErrorTitle?: string,
    customErrorMessage?: string
  ): Promise<T | null> => {
    if (loadingState) {
      setIsLoading(true);
    }
    clearError();
    
    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      handleError(err, customErrorTitle, customErrorMessage);
      return null;
    } finally {
      if (loadingState) {
        setIsLoading(false);
      }
    }
  };

  return {
    error,
    isLoading,
    setIsLoading,
    handleError,
    clearError,
    withErrorHandling,
  };
}
