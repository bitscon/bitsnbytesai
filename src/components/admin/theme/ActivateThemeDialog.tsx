
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeSettings } from './types';

interface ActivateThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPreset: ThemeSettings | null;
  onActivate: (presetId: string) => void;
  isLoading: boolean;
}

export function ActivateThemeDialog({
  open,
  onOpenChange,
  selectedPreset,
  onActivate,
  isLoading
}: ActivateThemeDialogProps) {
  const handleActivate = () => {
    if (selectedPreset && selectedPreset.id) {
      onActivate(selectedPreset.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Confirm Activation
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to activate the "{selectedPreset?.preset_name}" theme preset?
            This will change the appearance for all users.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleActivate} disabled={isLoading}>
            Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
