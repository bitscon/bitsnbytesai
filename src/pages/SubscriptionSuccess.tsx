
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserNavbar } from '@/components/UserNavbar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export default function SubscriptionSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { fetchUserSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('');
  
  useEffect(() => {
    const verifySubscription = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get('session_id');
        
        if (!sessionId) {
          toast({
            title: "Error",
            description: "No subscription information found.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/subscription'), 2000);
          return;
        }
        
        if (!user) {
          toast({
            title: "Error",
            description: "You must be logged in to verify your subscription.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        const customerId = sessionStorage.getItem('stripe_customer_id');
        sessionStorage.removeItem('stripe_customer_id');
        
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
          toast({
            title: "Error",
            description: "Failed to verify subscription. Please contact support.",
            variant: "destructive",
          });
          setIsSuccessful(false);
          return;
        }
        
        if (!data.success) {
          console.error('Subscription verification failed:', data);
          toast({
            title: "Error",
            description: data.message || "Subscription verification failed.",
            variant: "destructive",
          });
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
      } catch (error) {
        console.error('Error in subscription verification:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please contact support.",
          variant: "destructive",
        });
        setIsSuccessful(false);
      } finally {
        setIsProcessing(false);
      }
    };
    
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
                    <svg className="h-8 w-8 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Verification Issue</h1>
                  <p className="text-muted-foreground mb-4">
                    We couldn't verify your subscription. If you believe this is an error, please contact our support team.
                  </p>
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
