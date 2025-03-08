
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeSettings } from '@/components/admin/theme/types';

export function useThemePresetActions(
  selectedPreset: ThemeSettings | null,
  fetchThemePresets: () => Promise<void>,
  currentMode: 'light' | 'dark'
) {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

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

  return {
    isSaving,
    handleDeletePreset,
    handleActivatePreset,
    savePresetSettings
  };
}
