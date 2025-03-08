
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

interface PayPalCheckoutButtonProps {
  isLoading: boolean;
  onClick: () => void;
  disabled: boolean;
}

export function PayPalCheckoutButton({ 
  isLoading, 
  onClick, 
  disabled 
}: PayPalCheckoutButtonProps) {
  // Check if we're in sandbox mode by looking at the URL
  const isSandbox = window.location.hostname.includes('localhost') || 
                   window.location.hostname.includes('127.0.0.1') ||
                   window.location.hostname.includes('lovable.app');
  
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={onClick}
        disabled={disabled}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <svg
              className="mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 11c.33-1 1.67-5 5-5 4 0 4.33 4 4.33 5.33 0 .67 0 2.67-2 2.67h-2.33c-.67 0-2 0-2.67-1.33" />
              <path d="M4.33 16c.33-1 1.67-5 5-5 4 0 4.33 4 4.33 5.33 0 .67 0 2.67-2 2.67h-2.33c-.67 0-2 0-2.67-1.33" />
            </svg>
            Pay with PayPal
            {isSandbox && " (Sandbox)"}
          </>
        )}
      </Button>
      
      {isSandbox && (
        <div className="flex items-center text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>Using PayPal Sandbox environment - use sandbox test accounts only</span>
        </div>
      )}
    </div>
  );
}
