
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ThemeSettings } from './types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateThemePresetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (preset: Omit<ThemeSettings, 'id'>) => void;
  isLoading: boolean;
}

export function CreateThemePreset({ open, onOpenChange, onSubmit, isLoading }: CreateThemePresetProps) {
  const [presetName, setPresetName] = useState<string>('');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!presetName.trim()) {
      return;
    }
    
    const newPreset: Omit<ThemeSettings, 'id'> = {
      preset_name: presetName.trim(),
      brightness,
      contrast,
      saturation,
      is_dark: false,  // This will be set by the parent component
      is_active: false,
    };
    
    onSubmit(newPreset);
  };
  
  const resetForm = () => {
    setPresetName('');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Theme Preset</DialogTitle>
          <DialogDescription>
            Create a new theme preset with custom settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              placeholder="Enter preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="brightness">Brightness (%)</Label>
            <Input
              id="brightness"
              type="number"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contrast">Contrast (%)</Label>
            <Input
              id="contrast"
              type="number"
              min="50"
              max="150"
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value))}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="saturation">Saturation (%)</Label>
            <Input
              id="saturation"
              type="number"
              min="50"
              max="150"
              value={saturation}
              onChange={(e) => setSaturation(parseInt(e.target.value))}
              disabled={isLoading}
            />
          </div>
        </form>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !presetName.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
