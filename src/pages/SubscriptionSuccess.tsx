
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserNavbar } from '@/components/UserNavbar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useSubscription } from '@/hooks/use-subscription';
import { ArrowRight, Mail, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { StripeCheckoutStatus } from '@/components/subscription/StripeCheckoutStatus';
import { getCheckoutSessionIdFromUrl, getPendingUserData } from '@/utils/subscription/checkoutUtils';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionSuccess() {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUserSubscription } = useSubscription();
  const { toast } = useToast();
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);
  
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id') || getCheckoutSessionIdFromUrl();
  
  // Check if this was a new user signup
  useEffect(() => {
    const pendingUserData = getPendingUserData();
    if (pendingUserData) {
      setIsNewAccount(true);
      setUserEmail(pendingUserData.email);
    }
  }, []);
  
  // Attempt auto sign-in for new users
  useEffect(() => {
    const attemptAutoSignIn = async () => {
      if (isNewAccount && userEmail && subscriptionData && !user && !isAutoSigningIn) {
        const pendingUserData = getPendingUserData();
        if (pendingUserData && pendingUserData.password) {
          setIsAutoSigningIn(true);
          try {
            const { error } = await signIn(pendingUserData.email, pendingUserData.password);
            if (error) {
              console.error("Auto sign-in failed:", error);
              toast({
                title: "Sign-in failed",
                description: "Please sign in manually with your new account",
                variant: "destructive"
              });
            } else {
              toast({
                title: "Welcome!",
                description: "You've been automatically signed in to your new account",
              });
            }
          } catch (error) {
            console.error("Error during auto sign-in:", error);
          } finally {
            setIsAutoSigningIn(false);
          }
        }
      }
    };
    
    attemptAutoSignIn();
  }, [isNewAccount, userEmail, subscriptionData, user, signIn, toast]);
  
  // Refresh subscription data when verification is successful
  const handleSuccess = async (data: any) => {
    setSubscriptionData(data);
    setIsNewAccount(data.isNewUser || false);
    setUserEmail(data.email || null);
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
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Subscription Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
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
              
              {isNewAccount && subscriptionData && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                    <h3 className="font-medium">Account Created Successfully</h3>
                  </div>
                  <p className="text-sm mb-4">
                    Your new account has been created with your email: {userEmail}
                  </p>
                  {!user && (
                    <Button 
                      onClick={() => navigate('/login')} 
                      variant="outline" 
                      size="sm"
                      className="gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Sign in to your account
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center pt-2">
              <Button 
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="gap-2"
              >
                {user ? 'Go to Dashboard' : 'Sign In'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
