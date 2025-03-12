
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ManageSubscriptionProps {
  cancelAtPeriodEnd: boolean;
  isManagingSubscription: boolean;
  manageSubscription: (action: 'portal' | 'cancel' | 'reactivate') => Promise<void>;
}

export function ManageSubscription({ 
  cancelAtPeriodEnd, 
  isManagingSubscription, 
  manageSubscription 
}: ManageSubscriptionProps) {
  return (
    <div className="flex gap-2 mt-4">
      {cancelAtPeriodEnd ? (
        <Button
          variant="outline"
          onClick={() => manageSubscription('reactivate')}
          disabled={isManagingSubscription}
          className="flex items-center gap-2"
        >
          {isManagingSubscription && <Loader2 className="h-4 w-4 animate-spin" />}
          Resume Subscription
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => manageSubscription('cancel')}
          disabled={isManagingSubscription}
          className="flex items-center gap-2"
        >
          {isManagingSubscription && <Loader2 className="h-4 w-4 animate-spin" />}
          Cancel Subscription
        </Button>
      )}
      
      <Button
        variant="secondary"
        onClick={() => manageSubscription('portal')}
        disabled={isManagingSubscription}
        className="flex items-center gap-2"
      >
        {isManagingSubscription && <Loader2 className="h-4 w-4 animate-spin" />}
        Manage Billing
      </Button>
    </div>
  );
}
