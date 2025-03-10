
import React from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface PaymentErrorProps {
  error: string;
  onRetry?: () => void;
}

export function PaymentError({ error, onRetry }: PaymentErrorProps) {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Payment Error</AlertTitle>
      <AlertDescription className="flex flex-col">
        <p>{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-left underline text-sm mt-2 font-medium"
          >
            Try again
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}
