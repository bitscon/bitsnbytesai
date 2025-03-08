
import React, { useState } from 'react';
import { ThemePresets } from './ThemePresets';
import { ThemeSliders } from './ThemeSliders';
import { ThemeSettings } from './types';
import { DeleteThemeDialog } from './DeleteThemeDialog';
import { ActivateThemeDialog } from './ActivateThemeDialog';
import { ThemeControlActions } from './ThemeControlActions';

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

          <ThemeControlActions
            selectedPreset={selectedPreset}
            isLoading={isLoading}
            isSaving={isSaving}
            showDelete={!!onDeletePreset}
            showActivate={!!onActivatePreset}
            onDeleteClick={() => setIsDeleteDialogOpen(true)}
            onActivateClick={() => setIsActivateDialogOpen(true)}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {onDeletePreset && (
        <DeleteThemeDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          selectedPreset={selectedPreset}
          onDelete={onDeletePreset}
          isLoading={isSaving}
        />
      )}

      {/* Activate Confirmation Dialog */}
      {onActivatePreset && (
        <ActivateThemeDialog
          open={isActivateDialogOpen}
          onOpenChange={setIsActivateDialogOpen}
          selectedPreset={selectedPreset}
          onActivate={onActivatePreset}
          isLoading={isSaving}
        />
      )}
    </>
  );
}
