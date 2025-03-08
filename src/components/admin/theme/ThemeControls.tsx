
import React, { useState } from 'react';
import { ThemePresets } from './ThemePresets';
import { ThemeSliders } from './ThemeSliders';
import { ThemeSettings } from './types';
import { Button } from '@/components/ui/button';
import { Trash, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ThemeControlsProps {
  themePresets: ThemeSettings[];
  selectedPreset: ThemeSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  onPresetChange: (presetId: string) => void;
  onSliderChange: (name: 'brightness' | 'contrast' | 'saturation', value: number[]) => void;
  onDeletePreset?: (presetId: string) => void;
  onActivatePreset?: (presetId: string) => void;
}

export function ThemeControls({
  themePresets,
  selectedPreset,
  isLoading,
  isSaving,
  onPresetChange,
  onSliderChange,
  onDeletePreset,
  onActivatePreset
}: ThemeControlsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);

  const handleDelete = () => {
    if (selectedPreset && selectedPreset.id && onDeletePreset) {
      onDeletePreset(selectedPreset.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleActivate = () => {
    if (selectedPreset && selectedPreset.id && onActivatePreset) {
      onActivatePreset(selectedPreset.id);
      setIsActivateDialogOpen(false);
    }
  };

  return (
    <>
      <ThemePresets
        themePresets={themePresets}
        selectedPreset={selectedPreset}
        isLoading={isLoading}
        onPresetChange={onPresetChange}
      />

      {selectedPreset && (
        <>
          <ThemeSliders
            selectedPreset={selectedPreset}
            isLoading={isLoading}
            isSaving={isSaving}
            onSliderChange={onSliderChange}
          />

          {onDeletePreset && !selectedPreset.is_active && (
            <div className="mt-4">
              <Button 
                variant="destructive" 
                size="sm" 
                disabled={isLoading || isSaving || !selectedPreset} 
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Preset
              </Button>
            </div>
          )}
          
          {onActivatePreset && !selectedPreset.is_active && (
            <div className="mt-2">
              <Button 
                variant="default" 
                size="sm" 
                disabled={isLoading || isSaving || !selectedPreset || selectedPreset.is_active} 
                onClick={() => setIsActivateDialogOpen(true)}
              >
                Activate Preset
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation Dialog */}
      <Dialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsActivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleActivate}>
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
