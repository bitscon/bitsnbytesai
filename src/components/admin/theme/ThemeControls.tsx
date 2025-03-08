
import React from 'react';
import { ThemePresets } from './ThemePresets';
import { ThemeSliders } from './ThemeSliders';
import { ThemeSettings } from './types';

interface ThemeControlsProps {
  themePresets: ThemeSettings[];
  selectedPreset: ThemeSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  onPresetChange: (presetId: string) => void;
  onSliderChange: (name: 'brightness' | 'contrast' | 'saturation', value: number[]) => void;
}

export function ThemeControls({
  themePresets,
  selectedPreset,
  isLoading,
  isSaving,
  onPresetChange,
  onSliderChange
}: ThemeControlsProps) {
  return (
    <>
      <ThemePresets
        themePresets={themePresets}
        selectedPreset={selectedPreset}
        isLoading={isLoading}
        onPresetChange={onPresetChange}
      />

      {selectedPreset && (
        <ThemeSliders
          selectedPreset={selectedPreset}
          isLoading={isLoading}
          isSaving={isSaving}
          onSliderChange={onSliderChange}
        />
      )}
    </>
  );
}
