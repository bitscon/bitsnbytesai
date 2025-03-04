
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function CheckoutSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get("session_id");
        const paypalOrderId = sessionStorage.getItem("paypal_order_id");
        
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please log in to verify your purchase.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        if (sessionId) {
          // Verify Stripe payment
          const { data, error } = await supabase.functions.invoke("verify-payment", {
            body: { session_id: sessionId },
          });
          
          if (error || !data.success) {
            throw new Error(error?.message || data?.message || "Payment verification failed");
          }
          
          setIsVerified(true);
        } else if (paypalOrderId) {
          // Verify PayPal payment
          const { data, error } = await supabase.functions.invoke("paypal-capture-order", {
            body: { order_id: paypalOrderId },
          });
          
          if (error || !data.success) {
            throw new Error(error?.message || data?.message || "PayPal payment verification failed");
          }
          
          // Clear the order ID from session storage
          sessionStorage.removeItem("paypal_order_id");
          setIsVerified(true);
        } else {
          toast({
            title: "No payment information",
            description: "No payment information was found to verify.",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast({
          title: "Payment verification failed",
          description: "There was an error verifying your payment. Please contact support.",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [user, location.search, navigate, toast]);
  
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Verifying your payment...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <Card className="max-w-md mx-auto p-6">
          {isVerified ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground mb-6">
                Thank you for your purchase. You now have access to our full library of AI prompts.
              </p>
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="w-full bg-brand-blue hover:bg-brand-blue/90"
              >
                Access Your Prompts <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Payment Verification Failed</h1>
              <p className="text-muted-foreground mb-6">
                We couldn't verify your payment. Please contact our support team for assistance.
              </p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Return to Home
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
