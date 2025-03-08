
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeSettings } from '@/components/admin/theme/types';

export function useThemePresets(currentMode: 'light' | 'dark') {
  const [themePresets, setThemePresets] = useState<ThemeSettings[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ThemeSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});
  const { toast } = useToast();

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
      return true;
    } catch (error) {
      console.error('Error creating theme preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to create theme preset',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchThemePresets();
  }, [currentMode]);

  return {
    themePresets,
    selectedPreset,
    isLoading,
    isSaving,
    previewStyle,
    fetchThemePresets,
    handlePresetChange,
    handleSliderChange,
    handleDeletePreset,
    handleActivatePreset,
    savePresetSettings,
    handleCreatePreset
  };
}
