
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { ThemeSettings } from './types';

interface ThemeControlActionsProps {
  selectedPreset: ThemeSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  onDeleteClick: () => void;
  onActivateClick: () => void;
  showDelete?: boolean;
  showActivate?: boolean;
}

export function ThemeControlActions({
  selectedPreset,
  isLoading,
  isSaving,
  onDeleteClick,
  onActivateClick,
  showDelete = true,
  showActivate = true
}: ThemeControlActionsProps) {
  if (!selectedPreset) return null;
  
  return (
    <div className="mt-4 space-y-2">
      {showDelete && !selectedPreset.is_active && (
        <div>
          <Button 
            variant="destructive" 
            size="sm" 
            disabled={isLoading || isSaving || !selectedPreset} 
            onClick={onDeleteClick}
            className="text-foreground"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Preset
          </Button>
        </div>
      )}
      
      {showActivate && !selectedPreset.is_active && (
        <div>
          <Button 
            variant="default" 
            size="sm" 
            disabled={isLoading || isSaving || !selectedPreset || selectedPreset.is_active} 
            onClick={onActivateClick}
          >
            Activate Preset
          </Button>
        </div>
      )}
    </div>
  );
}
