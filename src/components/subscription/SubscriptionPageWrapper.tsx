
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserNavbar } from '@/components/UserNavbar';
import { useAuth } from '@/context/auth';
import { Loader2 } from 'lucide-react';

interface SubscriptionPageWrapperProps {
  children: React.ReactNode;
}

export function SubscriptionPageWrapper({ children }: SubscriptionPageWrapperProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar hasPurchased={false} />
        <div className="container mx-auto px-4 pt-24 pb-16 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar hasPurchased={user?.user_metadata?.hasPurchased || false} />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
