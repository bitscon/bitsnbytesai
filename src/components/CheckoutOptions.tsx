
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2 } from "lucide-react";

interface CheckoutOptionsProps {
  price: number;
  productName: string;
}

export function CheckoutOptions({ price, productName }: CheckoutOptionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [isLoadingPayPal, setIsLoadingPayPal] = useState(false);

  const handleStripeCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a purchase.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsLoadingStripe(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          price_id: "price_1OtQhgFCNu0wSsHhBRs2ZWZy", // Replace with your actual Stripe price ID
          user_id: user.id,
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: window.location.origin,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Checkout error",
        description: "There was an error starting the checkout process. Please try again.",
        variant: "destructive",
      });
      setIsLoadingStripe(false);
    }
  };

  const handlePayPalCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a purchase.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsLoadingPayPal(true);

    try {
      // Create a PayPal order
      const { data, error } = await supabase.functions.invoke("paypal-create-order", {
        body: {
          amount: price,
          user_id: user.id,
        },
      });

      if (error || !data.id) {
        throw new Error(error?.message || "Failed to create PayPal order");
      }

      // Store the order ID in session storage for verification
      sessionStorage.setItem("paypal_order_id", data.id);

      // Find the approve URL
      const approveUrl = data.links.find((link: any) => link.rel === "approve").href;
      
      // Redirect to PayPal
      window.location.href = approveUrl;
    } catch (error) {
      console.error("Error creating PayPal order:", error);
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
      <Button
        className="w-full"
        size="lg"
        onClick={handleStripeCheckout}
        disabled={isLoadingStripe}
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
        disabled={isLoadingPayPal}
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
