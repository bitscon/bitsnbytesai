
import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function SettingsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ShieldAlert className="h-12 w-12 text-muted-foreground mb-3" />
      <p className="text-muted-foreground">No API settings found.</p>
    </div>
  );
}
