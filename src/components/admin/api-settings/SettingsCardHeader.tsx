
import React from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SettingsCardHeader() {
  return (
    <CardHeader className="pb-3 border-b">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <CardTitle>API Settings</CardTitle>
      </div>
      <CardDescription>
        Configure global settings for your application
      </CardDescription>
      
      <Alert variant="warning" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          When using PayPal sandbox mode, use sandbox test accounts for payments. 
          These test accounts can be created in the PayPal Developer Dashboard.
        </AlertDescription>
      </Alert>
    </CardHeader>
  );
}
