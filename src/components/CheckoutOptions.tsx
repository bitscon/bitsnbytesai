
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmailInput } from "@/components/checkout/EmailInput";
import { PaymentError } from "@/components/checkout/PaymentError";
import { StripeCheckoutButton } from "@/components/checkout/StripeCheckoutButton";
import { PayPalCheckoutButton } from "@/components/checkout/PayPalCheckoutButton";
import { CheckoutLoading } from "@/components/checkout/CheckoutLoading";
import { 
  fetchStripePriceId, 
  validateEmail, 
  initiateStripeCheckout,
  initiatePayPalCheckout
} from "@/lib/checkout";
import { Separator } from "@/components/ui/separator";

interface CheckoutOptionsProps {
  price: number;
  productName: string;
}

export function CheckoutOptions({ price, productName }: CheckoutOptionsProps) {
  const { toast } = useToast();
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [isLoadingPayPal, setIsLoadingPayPal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [stripePriceId, setStripePriceId] = useState("");

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        setIsInitializing(true);
        const priceId = await fetchStripePriceId();
        setStripePriceId(priceId);
      } catch (error) {
        console.error("Failed to initialize checkout:", error);
        toast({
          title: "Error",
          description: "Unable to initialize checkout. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCheckout();
  }, [toast]);

  const handleStripeCheckout = async () => {
    if (!validateEmail(email, setEmailError)) {
      return;
    }

    setPaymentError("");
    setIsLoadingStripe(true);
    await initiateStripeCheckout(email, stripePriceId, setIsLoadingStripe, setPaymentError);
  };

  const handlePayPalCheckout = async () => {
    if (!validateEmail(email, setEmailError)) {
      return;
    }

    setPaymentError("");
    setIsLoadingPayPal(true);
    await initiatePayPalCheckout(email, price, setIsLoadingPayPal, setPaymentError);
  };

  if (isInitializing) {
    return <CheckoutLoading />;
  }

  return (
    <div className="space-y-4">
      <PaymentError error={paymentError} />
      <EmailInput 
        email={email} 
        setEmail={setEmail} 
        emailError={emailError} 
      />
      
      <StripeCheckoutButton 
        isLoading={isLoadingStripe}
        onClick={handleStripeCheckout}
        disabled={isLoadingStripe || isLoadingPayPal || !email || !stripePriceId}
      />
      
      <div className="relative py-2">
        <Separator />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background px-2 text-xs text-muted-foreground">or</span>
        </div>
      </div>
      
      <PayPalCheckoutButton 
        isLoading={isLoadingPayPal}
        onClick={handlePayPalCheckout}
        disabled={isLoadingPayPal || isLoadingStripe || !email}
      />
    </div>
  );
}
