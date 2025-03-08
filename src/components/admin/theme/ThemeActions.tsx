
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { ThemeSettings } from './types';

interface ThemeActionsProps {
  selectedPreset: ThemeSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
  onActivateClick: () => void;
}

export function ThemeActions({
  selectedPreset,
  isLoading,
  isSaving,
  onReset,
  onSave,
  onActivateClick
}: ThemeActionsProps) {
  return (
    <div className="flex justify-between">
      <Button
        variant="outline"
        onClick={onReset}
        disabled={isLoading || isSaving}
      >
        Reset
      </Button>
      <div className="space-x-2">
        <Button
          onClick={onSave}
          disabled={isLoading || isSaving || !selectedPreset}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
        <Button
          variant="default"
          onClick={onActivateClick}
          disabled={isLoading || isSaving || !selectedPreset || (selectedPreset && selectedPreset.is_active)}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Activate Theme
        </Button>
      </div>
    </div>
  );
}
