
import React from 'react';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { UserSubscription } from '@/types/subscription';

interface SubscriptionStatusProps {
  subscription: UserSubscription;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
}

export function SubscriptionStatus({ 
  subscription, 
  cancelAtPeriodEnd, 
  currentPeriodEnd 
}: SubscriptionStatusProps) {
  if (!subscription) return null;
  
  // Helper function to determine subscription status
  const getSubscriptionStatus = (): 'active' | 'canceled' | 'canceling' | 'inactive' => {
    if ((subscription as any).status === 'canceled') {
      return 'canceled';
    }
    
    if (cancelAtPeriodEnd) {
      return 'canceling';
    }
    
    if (subscription.tier !== 'free') {
      return 'active';
    }
    
    return 'inactive';
  };
  
  const status = getSubscriptionStatus();
  
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
        );
      case 'canceling':
        return (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Canceling</span>
          </div>
        );
      case 'canceled':
        return (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Canceled</span>
          </div>
        );
      case 'inactive':
        return (
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Inactive</span>
          </div>
        );
      default:
        return null;
    }
  };
  
  const getStatusMessage = () => {
    switch (status) {
      case 'active':
        if (currentPeriodEnd) {
          try {
            const endDate = new Date(currentPeriodEnd);
            const timeUntil = formatDistance(endDate, new Date(), { addSuffix: true });
            return `Renews ${timeUntil}`;
          } catch (error) {
            return 'Active subscription';
          }
        }
        return 'Active subscription';
        
      case 'canceling':
        if (currentPeriodEnd) {
          try {
            const endDate = new Date(currentPeriodEnd);
            const timeUntil = formatDistance(endDate, new Date(), { addSuffix: true });
            return `Access ends ${timeUntil}`;
          } catch (error) {
            return 'Will be canceled at the end of the billing period';
          }
        }
        return 'Will be canceled at the end of the billing period';
        
      case 'canceled':
        return 'Your subscription has ended';
        
      case 'inactive':
        return 'No active subscription';
        
      default:
        return '';
    }
  };
  
  return (
    <div className="space-y-1">
      {getStatusBadge()}
      <p className="text-xs text-gray-500 dark:text-gray-400">{getStatusMessage()}</p>
    </div>
  );
}
