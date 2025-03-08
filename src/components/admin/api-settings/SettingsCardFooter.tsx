
import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SettingsCardFooterProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function SettingsCardFooter({ isLoading, onRefresh }: SettingsCardFooterProps) {
  return (
    <CardFooter className="border-t px-6 py-4 bg-muted/30">
      <div className="w-full flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          These settings control global functionality across your application.
          Changes take effect immediately.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <span>Refresh</span>
          )}
        </Button>
      </div>
    </CardFooter>
  );
}
