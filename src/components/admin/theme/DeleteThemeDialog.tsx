
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
import { AlertTriangle } from 'lucide-react';
import { ThemeSettings } from './types';

interface DeleteThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPreset: ThemeSettings | null;
  onDelete: (presetId: string) => void;
  isLoading: boolean;
}

export function DeleteThemeDialog({
  open,
  onOpenChange,
  selectedPreset,
  onDelete,
  isLoading
}: DeleteThemeDialogProps) {
  const handleDelete = () => {
    if (selectedPreset && selectedPreset.id) {
      onDelete(selectedPreset.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Delete
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the "{selectedPreset?.preset_name}" theme preset?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
