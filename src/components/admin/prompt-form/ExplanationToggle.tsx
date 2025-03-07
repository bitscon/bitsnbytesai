
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ExplanationToggleProps {
  isEnabled: boolean;
  onToggle: (checked: boolean) => void;
}

export function ExplanationToggle({ isEnabled, onToggle }: ExplanationToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="explanation_enabled"
        checked={isEnabled}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="explanation_enabled">Enable explanation for this prompt</Label>
    </div>
  );
}
