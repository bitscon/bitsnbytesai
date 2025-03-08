
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save } from 'lucide-react';

interface ThemeSettings {
  id?: string;
  preset_name: string;
  is_dark: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  is_active: boolean;
}

export function ThemeCustomization() {
  const [themePresets, setThemePresets] = useState<ThemeSettings[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ThemeSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('light');
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchThemePresets();
  }, [currentMode]);

  // Fetch all theme presets for the current mode
  const fetchThemePresets = async () => {
    setIsLoading(true);
    try {
      const isDark = currentMode === 'dark';
      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .eq('is_dark', isDark)
        .order('preset_name');

      if (error) {
        throw new Error(error.message);
      }
      
      setThemePresets(data);
      
      // Find and set the active preset
      const activePreset = data.find(preset => preset.is_active);
      if (activePreset) {
        setSelectedPreset(activePreset);
        updatePreviewStyle(activePreset);
      } else if (data.length > 0) {
        setSelectedPreset(data[0]);
        updatePreviewStyle(data[0]);
      }
    } catch (error) {
      console.error('Error fetching theme presets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load theme presets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the preview style based on the selected preset
  const updatePreviewStyle = (preset: ThemeSettings) => {
    setPreviewStyle({
      filter: `brightness(${preset.brightness}%) contrast(${preset.contrast}%) saturate(${preset.saturation}%)`,
      transition: 'filter 0.3s ease'
    });
  };

  // Handle preset selection change
  const handlePresetChange = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(preset);
      updatePreviewStyle(preset);
    }
  };

  // Handle slider value changes
  const handleSliderChange = (name: 'brightness' | 'contrast' | 'saturation', value: number[]) => {
    if (!selectedPreset) return;
    
    const newValue = value[0];
    const updatedPreset = { ...selectedPreset, [name]: newValue };
    setSelectedPreset(updatedPreset);
    updatePreviewStyle(updatedPreset);
  };

  // Save the current preset settings
  const savePresetSettings = async (activate: boolean = false) => {
    if (!selectedPreset || !selectedPreset.id) return;
    
    setIsSaving(true);
    try {
      // If activating, set is_active to true
      const dataToUpdate = activate 
        ? { 
            brightness: selectedPreset.brightness, 
            contrast: selectedPreset.contrast, 
            saturation: selectedPreset.saturation,
            is_active: true
          }
        : { 
            brightness: selectedPreset.brightness, 
            contrast: selectedPreset.contrast, 
            saturation: selectedPreset.saturation
          };
      
      const { error } = await supabase
        .from('theme_settings')
        .update(dataToUpdate)
        .eq('id', selectedPreset.id);

      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: activate 
          ? 'Theme activated and settings saved' 
          : 'Theme settings saved',
      });
      
      // Refresh presets to get the updated active state
      fetchThemePresets();
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save theme settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Theme Customization</CardTitle>
        <CardDescription>
          Customize your application's appearance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="light" onValueChange={(value) => setCurrentMode(value as 'light' | 'dark')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="light">Light Mode</TabsTrigger>
                <TabsTrigger value="dark">Dark Mode</TabsTrigger>
              </TabsList>
              
              <TabsContent value="light" className="space-y-4 pt-4">
                <div className="space-y-4">
                  {renderThemeControls()}
                </div>
              </TabsContent>
              
              <TabsContent value="dark" className="space-y-4 pt-4">
                <div className="space-y-4">
                  {renderThemeControls()}
                </div>
              </TabsContent>
            </Tabs>

            <div className="rounded-lg border p-4 mt-4">
              <h3 className="text-lg font-medium mb-2">Theme Preview</h3>
              <div style={previewStyle}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold">Card Example</h4>
                    <p className="text-sm text-muted-foreground mt-2">This is how cards will appear with the current settings.</p>
                  </Card>
                  
                  <div className="space-y-2">
                    <Button>Primary Button</Button>
                    <Button variant="outline" className="ml-2">Outline Button</Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Text Input</Label>
                    <div className="flex items-center space-x-2">
                      <Switch id="preview-switch" />
                      <Label htmlFor="preview-switch">Toggle Example</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => fetchThemePresets()}
          disabled={isLoading || isSaving}
        >
          Reset
        </Button>
        <div className="space-x-2">
          <Button
            onClick={() => savePresetSettings(false)}
            disabled={isLoading || isSaving || !selectedPreset}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
          <Button
            variant="default"
            onClick={() => savePresetSettings(true)}
            disabled={isLoading || isSaving || !selectedPreset || (selectedPreset && selectedPreset.is_active)}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Activate Theme
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  // Helper function to render theme controls
  function renderThemeControls() {
    return (
      <>
        <div>
          <Label htmlFor="preset-select">Select Preset</Label>
          <Select
            value={selectedPreset?.id || ''}
            onValueChange={handlePresetChange}
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

        {selectedPreset && (
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
                onValueChange={(value) => handleSliderChange('brightness', value)}
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
                onValueChange={(value) => handleSliderChange('contrast', value)}
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
                onValueChange={(value) => handleSliderChange('saturation', value)}
                disabled={isLoading || isSaving}
              />
            </div>
          </div>
        )}
      </>
    );
  }
}
