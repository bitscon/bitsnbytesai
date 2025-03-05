
import { ToastFunction } from './signInUtils';

interface ErrorHandlerOptions {
  toast: ToastFunction;
  title?: string;
  defaultMessage?: string;
}

export const handleAuthError = (
  error: any, 
  { 
    toast, 
    title = "Error", 
    defaultMessage = "An unexpected error occurred. Please try again later." 
  }: ErrorHandlerOptions
) => {
  console.error(`Auth error:`, error);
  
  let errorMessage = defaultMessage;
  
  // Handle common authentication errors
  if (error?.message) {
    if (error.message.includes("email")) {
      errorMessage = "This email is already registered or invalid. Please use a different email.";
    } else if (error.message.includes("password")) {
      errorMessage = "Password is too weak. Please use a stronger password with at least 6 characters.";
    } else if (error.message.includes("Invalid login credentials")) {
      errorMessage = "The email or password you entered is incorrect. Please try again.";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Please verify your email before signing in. Check your inbox for a verification link.";
    } else {
      // Use the original error message if it exists and none of the above patterns match
      errorMessage = error.message;
    }
  }
  
  toast({
    title,
    description: errorMessage,
    variant: "destructive",
  });
  
  return errorMessage;
};

export const showSuccessToast = (
  toast: ToastFunction,
  title: string,
  description: string
) => {
  toast({
    title,
    description,
  });
};
