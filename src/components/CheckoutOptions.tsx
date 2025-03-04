
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface CheckoutOptionsProps {
  price: number;
  productName: string;
}

export function CheckoutOptions({ price, productName }: CheckoutOptionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [isLoadingPayPal, setIsLoadingPayPal] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = re.test(email);
    if (!isValid) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
    return isValid;
  };

  const handleStripeCheckout = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setPaymentError("");
    setIsLoadingStripe(true);

    try {
      console.log("Initiating Stripe checkout for email:", email);
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          price_id: "price_1OtQhgFCNu0wSsHhBRs2ZWZy", // Replace with your actual Stripe price ID
          email: email,
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: window.location.origin,
        },
      });

      if (error) {
        console.error("Error invoking create-checkout-session:", error);
        throw new Error(error.message);
      }

      if (!data?.url) {
        console.error("No checkout URL returned:", data);
        throw new Error("Failed to create checkout session");
      }

      // Store the email in session storage for verification
      sessionStorage.setItem("customer_email", email);
      
      // Redirect to Stripe Checkout
      console.log("Redirecting to Stripe checkout URL:", data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setPaymentError("There was an error starting the checkout process. Please try again.");
      toast({
        title: "Checkout error",
        description: "There was an error starting the checkout process. Please try again.",
        variant: "destructive",
      });
      setIsLoadingStripe(false);
    }
  };

  const handlePayPalCheckout = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setPaymentError("");
    setIsLoadingPayPal(true);

    try {
      console.log("Initiating PayPal checkout for email:", email);
      // Create a PayPal order
      const { data, error } = await supabase.functions.invoke("paypal-create-order", {
        body: {
          amount: price,
          email: email,
        },
      });

      if (error) {
        console.error("Error invoking paypal-create-order:", error);
        throw new Error(error.message);
      }

      if (!data?.id) {
        console.error("No order ID returned:", data);
        throw new Error("Failed to create PayPal order");
      }

      // Store the order ID and email in session storage for verification
      sessionStorage.setItem("paypal_order_id", data.id);
      sessionStorage.setItem("customer_email", email);
      
      // Find the approve URL
      const approveUrl = data.links.find((link: any) => link.rel === "approve")?.href;
      
      if (!approveUrl) {
        console.error("No approve URL found in PayPal response:", data);
        throw new Error("Missing PayPal approval URL");
      }
      
      // Redirect to PayPal
      console.log("Redirecting to PayPal approval URL:", approveUrl);
      window.location.href = approveUrl;
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      setPaymentError("There was an error starting the PayPal checkout process. Please try again.");
      toast({
        title: "Checkout error",
        description: "There was an error starting the PayPal checkout process. Please try again.",
        variant: "destructive",
      });
      setIsLoadingPayPal(false);
    }
  };

  return (
    <div className="space-y-4">
      {paymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={emailError ? "border-red-500" : ""}
        />
        {emailError && <p className="text-sm text-red-500">{emailError}</p>}
      </div>
      
      <Button
        className="w-full"
        size="lg"
        onClick={handleStripeCheckout}
        disabled={isLoadingStripe || isLoadingPayPal || !email}
      >
        {isLoadingStripe ? (
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
      
      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={handlePayPalCheckout}
        disabled={isLoadingPayPal || isLoadingStripe || !email}
      >
        {isLoadingPayPal ? (
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
          </>
        )}
      </Button>
    </div>
  );
}
