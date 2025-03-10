
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserNavbar } from '@/components/UserNavbar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, ArrowRight, AlertCircle, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SubscriptionSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { fetchUserSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);
  
  const verifySubscription = async () => {
    try {
      setIsRetrying(true);
      setIsProcessing(true);
      setErrorMessage('');
      
      const queryParams = new URLSearchParams(location.search);
      const sessionId = queryParams.get('session_id');
      
      if (!sessionId) {
        setErrorMessage("No subscription information found. The checkout session ID is missing.");
        setIsSuccessful(false);
        return;
      }
      
      if (!user) {
        setErrorMessage("You must be logged in to verify your subscription.");
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const customerId = sessionStorage.getItem('stripe_customer_id');
      
      // Verify the subscription with the session ID
      const { data, error } = await supabase.functions.invoke('verify-subscription', {
        body: { 
          sessionId,
          userId: user.id,
          customerId
        }
      });
      
      if (error) {
        console.error('Error verifying subscription:', error);
        setErrorMessage(`Verification failed: ${error.message || "Unknown error"}`);
        setIsSuccessful(false);
        return;
      }
      
      if (!data || !data.success) {
        console.error('Subscription verification failed:', data);
        setErrorMessage(data?.message || "Subscription verification failed. Please contact support.");
        setIsSuccessful(false);
        return;
      }
      
      // Update subscription data
      await fetchUserSubscription();
      
      setSubscriptionTier(data.tier || 'Pro');
      setIsSuccessful(true);
      
      toast({
        title: "Success!",
        description: `Your ${data.tier || 'Pro'} subscription is now active.`,
      });
    } catch (error: any) {
      console.error('Error in subscription verification:', error);
      setErrorMessage(`Verification error: ${error.message || "An unexpected error occurred"}`);
      setIsSuccessful(false);
      
      toast({
        title: "Verification Error",
        description: "There was a problem verifying your subscription. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsRetrying(false);
    }
  };
  
  useEffect(() => {
    verifySubscription();
  }, [location.search, user, navigate, toast, fetchUserSubscription]);
  
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar hasPurchased={true} />
        <div className="container mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md p-6 text-center">
            <CardContent className="pt-6 pb-4">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <h1 className="text-2xl font-bold mb-2">Processing Your Subscription</h1>
              <p className="text-muted-foreground">
                Please wait while we confirm your subscription...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <UserNavbar hasPurchased={isSuccessful} />
      <div className="container mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 text-center">
            <CardContent className="pt-6 pb-4">
              {isSuccessful ? (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Subscription Activated!</h1>
                  <p className="text-muted-foreground mb-4">
                    Your {subscriptionTier} subscription has been successfully activated. You now have full access to all premium features.
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Verification Issue</h1>
                  
                  {errorMessage && (
                    <Alert variant="destructive" className="mb-4 text-left">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  <p className="text-muted-foreground mb-4">
                    We couldn't verify your subscription. You can try again or contact our support team for assistance.
                  </p>
                  
                  <Button 
                    onClick={verifySubscription} 
                    variant="outline" 
                    disabled={isRetrying}
                    className="mb-4"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Try Again
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-center pt-2">
              <Button 
                onClick={() => navigate(isSuccessful ? '/dashboard' : '/subscription')}
                className="gap-2"
              >
                {isSuccessful ? 'Go to Dashboard' : 'Return to Subscription Page'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
