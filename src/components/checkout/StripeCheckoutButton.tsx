
import React from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

interface StripeCheckoutButtonProps {
  isLoading: boolean;
  onClick: () => void;
  disabled: boolean;
}

export function StripeCheckoutButton({ 
  isLoading, 
  onClick, 
  disabled 
}: StripeCheckoutButtonProps) {
  return (
    <Button
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
          <CreditCard className="mr-2 h-4 w-4" />
          Pay with Card
        </>
      )}
    </Button>
  );
}
