
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createStripeCheckout } from '@/utils/subscription/checkoutUtils';
import { storeSessionData } from '@/utils/subscription/paymentUtils';
import { BillingIntervalSelector } from '@/components/subscription/BillingIntervalSelector';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  // Get plan data from location state
  const planId = location.state?.planId;
  const planName = location.state?.planName;
  const planPrice = location.state?.planPrice;
  const priceId = location.state?.priceId;

  if (!planId && !location.state?.demo) {
    // If no plan was selected, redirect to subscription page
    navigate('/subscription');
  }

  const handleSignupAndCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Store user details in session storage for retrieval after payment
      storeSessionData('pending_user_email', email);
      storeSessionData('pending_user_fullname', fullName);
      storeSessionData('pending_user_password', password);
      
      // Start the checkout process directly without creating user first
      if (planId && priceId) {
        const checkoutResult = await createStripeCheckout(
          priceId,
          billingInterval,
          undefined, // No user ID yet
          undefined // No customer ID yet
        );
        
        if (!checkoutResult.success) {
          throw new Error(checkoutResult.message || 'Checkout session creation failed');
        }
        
        // The createStripeCheckout function will redirect the user to Stripe
        // We don't need to do anything else here as the user will be redirected
      } else {
        // Demo mode or something went wrong
        toast({
          title: "Demo mode",
          description: "In a production environment, this would redirect to Stripe Checkout",
        });
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Error during signup and checkout:', error);
      setError(error.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <a href="/" className="flex items-center justify-center space-x-2 mb-8">
          <span className="text-xl font-bold text-brand-blue">bits & bytes</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">AI</span>
        </a>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Subscribe to {planName || 'Premium'}</CardTitle>
            <CardDescription className="text-center">
              Create your account and subscribe in one step
            </CardDescription>
          </CardHeader>
          <CardContent>
            {planName && planPrice && (
              <div className="mb-6 p-4 bg-muted rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Selected Plan:</span>
                  <span className="font-bold">{planName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Price:</span>
                  <span className="text-lg">${planPrice}/{billingInterval}</span>
                </div>
                
                <div className="mt-4">
                  <BillingIntervalSelector 
                    billingInterval={billingInterval}
                    setBillingInterval={setBillingInterval}
                  />
                </div>
              </div>
            )}

            <Alert className="mb-6 bg-blue-50 text-blue-700 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your account will be created after successful payment
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSignupAndCheckout} className="space-y-4">
              {error && (
                <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <a
                onClick={() => navigate("/login")}
                className="text-primary hover:underline cursor-pointer"
              >
                Sign in
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
