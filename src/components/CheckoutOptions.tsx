
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutOptionsProps {
  priceId: string;
  amount: number;
  onClose?: () => void;
}

export default function CheckoutOptions({ priceId, amount, onClose }: CheckoutOptionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="mb-4">Please log in to continue with your purchase.</p>
        <Button onClick={() => navigate("/login")}>Log In</Button>
      </div>
    );
  }

  const handleStripeCheckout = async () => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          price_id: priceId,
          user_id: user.id,
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw error;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handlePayPalCheckout = async () => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke("paypal-create-order", {
        body: {
          amount: amount,
          user_id: user.id,
        },
      });

      if (error) {
        throw error;
      }

      // Find the approval URL
      const approvalLink = data.links.find((link: any) => link.rel === "approve");
      if (approvalLink) {
        // Store the order ID in session storage
        sessionStorage.setItem("paypal_order_id", data.id);
        // Redirect to PayPal
        window.location.href = approvalLink.href;
      } else {
        throw new Error("PayPal approval link not found");
      }
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      toast({
        title: "Error",
        description: "Failed to create PayPal order. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-medium">Choose Payment Method</h3>
        <p className="text-muted-foreground">Secure, one-time payment</p>
      </div>
      
      <Button
        onClick={handleStripeCheckout}
        disabled={isProcessing}
        className="w-full flex items-center justify-center h-12"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Pay with Card
      </Button>
      
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative px-4 bg-background text-sm text-muted-foreground">or</div>
      </div>
      
      <Button
        onClick={handlePayPalCheckout}
        disabled={isProcessing}
        variant="outline"
        className="w-full flex items-center justify-center h-12"
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.067 8.478c.492.315.775.809.775 1.37 0 1.593-1.346 2.509-3.585 2.509h-.414l.271 1.717h-.898l-.152-.953-.084-.764h-3.484l-.271 1.717h-.898l.707-4.479h5.033c1.346 0 2.168-.37 2.168-1.177 0-.269-.084-.471-.236-.64-.169-.168-.438-.235-.843-.235h-4.62l.707-4.479h5.032c1.768 0 2.557.786 2.557 1.752 0 .994-.627 1.683-1.765 1.909v.07c.58.078 1.025.27 1.328.56Zm-5.87-3.933h-3.82l-.27 1.716h3.484c.724 0 1.244-.37 1.244-.92 0-.471-.353-.796-1.008-.796h.371Zm-5.537 1.137L6.887 13.72h.897l1.009-6.383H7.896l.764-1.655Z" />
        </svg>
        Pay with PayPal
      </Button>
      
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center">
          <Check className="mr-1 h-4 w-4 text-green-500" />
          Secure payment
        </p>
        <p className="mt-1">
          By proceeding, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
