
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { CheckCircle, ArrowRight, Mail, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CheckoutSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get("session_id");
        const paypalOrderId = sessionStorage.getItem("paypal_order_id");
        const storedEmail = sessionStorage.getItem("customer_email");
        
        console.log("Verifying payment:", { 
          sessionId, 
          paypalOrderId, 
          storedEmail 
        });
        
        if (sessionId) {
          // Verify Stripe payment
          console.log("Verifying Stripe payment with session ID:", sessionId);
          const { data, error } = await supabase.functions.invoke("verify-payment", {
            body: { session_id: sessionId },
          });
          
          if (error) {
            console.error("Error verifying Stripe payment:", error);
            throw new Error(error.message);
          }
          
          if (!data?.success) {
            console.error("Stripe payment verification failed:", data);
            throw new Error(data?.message || "Payment verification failed");
          }
          
          console.log("Stripe payment verified:", data);
          setIsNewUser(data.isNewUser || false);
          setCustomerEmail(data.email || "");
          setIsVerified(true);
        } else if (paypalOrderId) {
          // Verify PayPal payment
          console.log("Verifying PayPal payment with order ID:", paypalOrderId);
          const { data, error } = await supabase.functions.invoke("paypal-capture-order", {
            body: { 
              order_id: paypalOrderId,
              customer_email: storedEmail
            },
          });
          
          if (error) {
            console.error("Error verifying PayPal payment:", error);
            throw new Error(error.message);
          }
          
          if (!data?.success) {
            console.error("PayPal payment verification failed:", data);
            throw new Error(data?.message || "PayPal payment verification failed");
          }
          
          // Clear the order ID from session storage
          sessionStorage.removeItem("paypal_order_id");
          sessionStorage.removeItem("customer_email");
          
          console.log("PayPal payment verified:", data);
          setIsNewUser(data.isNewUser || false);
          setCustomerEmail(data.email || "");
          setIsVerified(true);
        } else {
          setErrorMessage("No payment information was found to verify.");
          console.error("No payment information found");
          toast({
            title: "No payment information",
            description: "No payment information was found to verify.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/"), 3000);
        }
      } catch (error: any) {
        console.error("Error verifying payment:", error);
        setErrorMessage(error.message || "Payment verification failed");
        toast({
          title: "Payment verification failed",
          description: error.message || "There was an error verifying your payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [location.search, navigate, toast]);
  
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Verifying your payment...</h1>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              
              {isNewUser ? (
                <div>
                  <p className="text-muted-foreground mb-4">
                    Thank you for your purchase! We've created an account for you.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <div className="flex items-center mb-2">
                      <Mail className="h-5 w-5 text-blue-500 mr-2" />
                      <h3 className="font-medium text-blue-700">Check your email</h3>
                    </div>
                    <p className="text-sm text-blue-600">
                      We've sent your login details to <strong>{customerEmail}</strong>. 
                      Check your inbox to access your new account.
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate("/login")} 
                    className="w-full bg-brand-blue hover:bg-brand-blue/90 mb-3"
                  >
                    Go to Login
                  </Button>
                </div>
              ) : (
                <div>
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
              )}
            </div>
          ) : (
            <div className="text-center">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Payment Verification Failed</AlertTitle>
                <AlertDescription>
                  {errorMessage || "We couldn't verify your payment. Please contact our support team for assistance."}
                </AlertDescription>
              </Alert>
              <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
                Return to Home
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
