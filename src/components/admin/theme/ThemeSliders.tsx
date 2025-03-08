
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ThemeSettings } from './types';

interface ThemeSlidersProps {
  selectedPreset: ThemeSettings;
  isLoading: boolean;
  isSaving: boolean;
  onSliderChange: (name: 'brightness' | 'contrast' | 'saturation', value: number[]) => void;
}

export function ThemeSliders({ selectedPreset, isLoading, isSaving, onSliderChange }: ThemeSlidersProps) {
  if (!selectedPreset) return null;
  
  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="brightness-slider">Brightness: {selectedPreset.brightness}%</Label>
        </div>
        <Slider
          id="brightness-slider"
          min={50}
          max={150}
          step={1}
          value={[selectedPreset.brightness]}
          onValueChange={(value) => onSliderChange('brightness', value)}
          disabled={isLoading || isSaving}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="contrast-slider">Contrast: {selectedPreset.contrast}%</Label>
        </div>
        <Slider
          id="contrast-slider"
          min={50}
          max={150}
          step={1}
          value={[selectedPreset.contrast]}
          onValueChange={(value) => onSliderChange('contrast', value)}
          disabled={isLoading || isSaving}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="saturation-slider">Saturation: {selectedPreset.saturation}%</Label>
        </div>
        <Slider
          id="saturation-slider"
          min={50}
          max={150}
          step={1}
          value={[selectedPreset.saturation]}
          onValueChange={(value) => onSliderChange('saturation', value)}
          disabled={isLoading || isSaving}
        />
      </div>
    </div>
  );
}
