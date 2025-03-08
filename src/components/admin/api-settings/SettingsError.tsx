
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SettingsErrorProps {
  onRetry: () => void;
}

export function SettingsError({ onRetry }: SettingsErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Failed to load API settings. Please try again or check your connection.
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry} 
          className="ml-2"
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
