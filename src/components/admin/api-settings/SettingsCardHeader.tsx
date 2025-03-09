
import React from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SettingsCardHeader() {
  return (
    <CardHeader className="pb-3 border-b">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <CardTitle>API Settings & Key Management</CardTitle>
      </div>
      <CardDescription>
        Securely manage API keys and integration settings for your application
      </CardDescription>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            API keys are securely stored and partially masked for protection. Set expiry dates to enforce key rotation.
          </AlertDescription>
        </Alert>
        
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            When using sandbox/test environments, use test accounts for services. Keys should be rotated every 90 days.
          </AlertDescription>
        </Alert>
      </div>
    </CardHeader>
  );
}
