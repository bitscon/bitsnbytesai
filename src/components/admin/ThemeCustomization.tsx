import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save } from 'lucide-react';
import { useTheme } from '@/context/theme/ThemeContext';
import { ThemeControls } from './theme/ThemeControls';
import { ThemePreview } from './theme/ThemePreview';
import { ThemeSettings } from './theme/types';
import { CreateThemePreset } from './theme/CreateThemePreset';

export function ThemeCustomization() {
  const [themePresets, setThemePresets] = useState<ThemeSettings[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ThemeSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('light');
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState<boolean>(false);
  const [isCreatePresetOpen, setIsCreatePresetOpen] = useState<boolean>(false);
  const { toast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    setCurrentMode(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    fetchThemePresets();
  }, [currentMode]);

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

  const handleModeChange = (value: string) => {
    const newMode = value as 'light' | 'dark';
    setCurrentMode(newMode);
    
    if ((newMode === 'dark' && !isDarkMode) || (newMode === 'light' && isDarkMode)) {
      toggleTheme();
    }
  };

  const updatePreviewStyle = (preset: ThemeSettings) => {
    setPreviewStyle({
      filter: `brightness(${preset.brightness}%) contrast(${preset.contrast}%) saturate(${preset.saturation}%)`,
      transition: 'filter 0.3s ease'
    });
  };

  const handlePresetChange = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(preset);
      updatePreviewStyle(preset);
    }
  };

  const handleSliderChange = (name: 'brightness' | 'contrast' | 'saturation', value: number[]) => {
    if (!selectedPreset) return;
    
    const newValue = value[0];
    const updatedPreset = { ...selectedPreset, [name]: newValue };
    setSelectedPreset(updatedPreset);
    updatePreviewStyle(updatedPreset);
  };

  const handleDeletePreset = async (presetId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('theme_settings')
        .delete()
        .eq('id', presetId);

      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Theme preset deleted',
      });
      
      fetchThemePresets();
    } catch (error) {
      console.error('Error deleting theme preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete theme preset',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivatePreset = async (presetId: string) => {
    if (!selectedPreset) return;
    
    setIsSaving(true);
    try {
      const { error: resetError } = await supabase
        .from('theme_settings')
        .update({ is_active: false })
        .eq('is_dark', currentMode === 'dark');
      
      if (resetError) {
        throw new Error(resetError.message);
      }
      
      const { error } = await supabase
        .from('theme_settings')
        .update({
          brightness: selectedPreset.brightness,
          contrast: selectedPreset.contrast,
          saturation: selectedPreset.saturation,
          is_active: true
        })
        .eq('id', presetId);

      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Theme activated and settings saved',
      });
      
      fetchThemePresets();
    } catch (error) {
      console.error('Error activating theme preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate theme preset',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const savePresetSettings = async () => {
    if (!selectedPreset || !selectedPreset.id) return;
    
    setIsSaving(true);
    try {
      const dataToUpdate = { 
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
        description: 'Theme settings saved',
      });
      
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

  const handleCreatePreset = async (preset: Omit<ThemeSettings, 'id'>) => {
    setIsSaving(true);
    try {
      const newPreset = {
        ...preset,
        is_dark: currentMode === 'dark',
        is_active: false
      };
      
      const { data, error } = await supabase
        .from('theme_settings')
        .insert(newPreset)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'New theme preset created',
      });
      
      await fetchThemePresets();
      if (data) {
        handlePresetChange(data.id);
      }
      setIsCreatePresetOpen(false);
    } catch (error) {
      console.error('Error creating theme preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to create theme preset',
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
            <div className="flex justify-between items-center">
              <Tabs 
                value={currentMode} 
                onValueChange={handleModeChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="light">Light Mode</TabsTrigger>
                  <TabsTrigger value="dark">Dark Mode</TabsTrigger>
                </TabsList>
                
                <TabsContent value="light" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-end mb-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreatePresetOpen(true)}
                        size="sm"
                      >
                        Create New Preset
                      </Button>
                    </div>
                    <ThemeControls
                      themePresets={themePresets}
                      selectedPreset={selectedPreset}
                      isLoading={isLoading}
                      isSaving={isSaving}
                      onPresetChange={handlePresetChange}
                      onSliderChange={handleSliderChange}
                      onDeletePreset={handleDeletePreset}
                      onActivatePreset={(presetId) => {
                        if (selectedPreset && selectedPreset.id) {
                          setIsActivateDialogOpen(true);
                        }
                      }}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="dark" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-end mb-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreatePresetOpen(true)}
                        size="sm"
                      >
                        Create New Preset
                      </Button>
                    </div>
                    <ThemeControls
                      themePresets={themePresets}
                      selectedPreset={selectedPreset}
                      isLoading={isLoading}
                      isSaving={isSaving}
                      onPresetChange={handlePresetChange}
                      onSliderChange={handleSliderChange}
                      onDeletePreset={handleDeletePreset}
                      onActivatePreset={(presetId) => {
                        if (selectedPreset && selectedPreset.id) {
                          setIsActivateDialogOpen(true);
                        }
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <ThemePreview previewStyle={previewStyle} />
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
            onClick={savePresetSettings}
            disabled={isLoading || isSaving || !selectedPreset}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
          <Button
            variant="default"
            onClick={() => selectedPreset && !selectedPreset.is_active ? setIsActivateDialogOpen(true) : null}
            disabled={isLoading || isSaving || !selectedPreset || (selectedPreset && selectedPreset.is_active)}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Activate Theme
          </Button>
        </div>
      </CardFooter>

      <CreateThemePreset 
        open={isCreatePresetOpen} 
        onOpenChange={setIsCreatePresetOpen}
        onSubmit={handleCreatePreset}
        isLoading={isSaving}
      />
    </Card>
  );
}
