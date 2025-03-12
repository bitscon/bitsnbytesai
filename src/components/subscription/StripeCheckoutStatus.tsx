
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { verifySubscription } from '@/utils/subscription/checkoutUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface StripeCheckoutStatusProps {
  sessionId: string;
  onSuccess: (data: any) => void;
  onError: (message: string) => void;
}

export function StripeCheckoutStatus({ 
  sessionId, 
  onSuccess, 
  onError 
}: StripeCheckoutStatusProps) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const verifyCheckout = async () => {
    try {
      setIsVerifying(true);
      setVerificationError('');
      
      if (!user) {
        const message = 'You must be logged in to verify your subscription.';
        setVerificationError(message);
        onError(message);
        return;
      }
      
      const result = await verifySubscription(sessionId, user.id);
      
      if (!result.success) {
        setVerificationError(result.message || 'Verification failed');
        onError(result.message || 'Verification failed');
        return;
      }
      
      // Verification successful
      onSuccess(result.data);
      
      toast({
        title: "Success!",
        description: `Your subscription is now active.`,
      });
      
    } catch (error: any) {
      console.error('Error in verifyCheckout:', error);
      setVerificationError(error.message || 'An unexpected error occurred');
      onError(error.message || 'An unexpected error occurred');
    } finally {
      setIsVerifying(false);
    }
  };
  
  useEffect(() => {
    if (sessionId) {
      verifyCheckout();
    }
  }, [sessionId]);
  
  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Verifying your subscription...</p>
        <p className="text-sm text-muted-foreground mt-2">This may take a moment.</p>
      </div>
    );
  }
  
  if (verificationError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Verification Failed</AlertTitle>
          <AlertDescription>{verificationError}</AlertDescription>
        </Alert>
        
        <Button 
          onClick={verifyCheckout} 
          variant="outline" 
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-xl font-bold mb-2">Subscription Activated!</h2>
      <p className="text-center text-muted-foreground">
        Your subscription has been successfully activated. You now have access to all premium features.
      </p>
    </div>
  );
}
