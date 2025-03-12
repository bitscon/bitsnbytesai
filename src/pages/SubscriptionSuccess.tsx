
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserNavbar } from '@/components/UserNavbar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useSubscription } from '@/hooks/use-subscription';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { StripeCheckoutStatus } from '@/components/subscription/StripeCheckoutStatus';
import { getCheckoutSessionIdFromUrl } from '@/utils/subscription/checkoutUtils';

export default function SubscriptionSuccess() {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUserSubscription } = useSubscription();
  
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id') || getCheckoutSessionIdFromUrl();
  
  // Refresh subscription data when verification is successful
  const handleSuccess = async (data: any) => {
    setSubscriptionData(data);
    await fetchUserSubscription();
  };
  
  // Set error message when verification fails
  const handleError = (message: string) => {
    setErrorMessage(message);
  };
  
  // If redirected back from success URL without session ID, check session storage
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('checkout_session_id');
    if (!sessionId && storedSessionId) {
      // Redirect to include the session ID in the URL
      navigate(`/subscription/success?session_id=${storedSessionId}`, { replace: true });
    }
  }, [sessionId, navigate]);
  
  return (
    <div className="min-h-screen bg-background">
      <UserNavbar hasPurchased={!!subscriptionData} />
      <div className="container mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 text-center">
            <CardContent className="pt-6 pb-4">
              {sessionId ? (
                <StripeCheckoutStatus
                  sessionId={sessionId}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              ) : (
                <div className="text-center">
                  <p className="text-lg font-medium mb-4">
                    No subscription information found. The checkout session ID is missing.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please return to the subscription page and try again.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center pt-2">
              <Button 
                onClick={() => navigate(subscriptionData ? '/dashboard' : '/subscription')}
                className="gap-2"
              >
                {subscriptionData ? 'Go to Dashboard' : 'Return to Subscription Page'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
