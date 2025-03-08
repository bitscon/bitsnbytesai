
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeSettings } from './types';

interface ThemePresetsProps {
  themePresets: ThemeSettings[];
  selectedPreset: ThemeSettings | null;
  isLoading: boolean;
  onPresetChange: (presetId: string) => void;
}

export function ThemePresets({ themePresets, selectedPreset, isLoading, onPresetChange }: ThemePresetsProps) {
  return (
    <div>
      <Label htmlFor="preset-select">Select Preset</Label>
      <Select
        value={selectedPreset?.id || ''}
        onValueChange={onPresetChange}
        disabled={isLoading || themePresets.length === 0}
      >
        <SelectTrigger id="preset-select" className="w-full">
          <SelectValue placeholder="Select a theme preset" />
        </SelectTrigger>
        <SelectContent>
          {themePresets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id || ''}>
              {preset.preset_name} {preset.is_active ? '(Active)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
