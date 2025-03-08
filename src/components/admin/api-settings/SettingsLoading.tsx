
import React from 'react';
import { Loader2 } from 'lucide-react';

export function SettingsLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-muted-foreground">Loading settings...</p>
    </div>
  );
}
