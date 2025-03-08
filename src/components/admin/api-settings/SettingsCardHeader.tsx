
import React from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

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
    </CardHeader>
  );
}
