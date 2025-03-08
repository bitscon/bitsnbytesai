
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
      // Don't allow deleting active presets
      const { data: presetData } = await supabase
        .from('theme_settings')
        .select('is_active')
        .eq('id', presetId)
        .single();
      
      if (presetData && presetData.is_active) {
        toast({
          title: 'Error',
          description: 'Cannot delete an active theme preset',
          variant: 'destructive',
        });
        return;
      }
      
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
      console.log('Activating theme preset:', presetId);
      
      // First, deactivate all presets for the current mode
      const { error: resetError } = await supabase
        .from('theme_settings')
        .update({ is_active: false })
        .eq('is_dark', currentMode === 'dark');
      
      if (resetError) {
        throw new Error(resetError.message);
      }
      
      // Then, activate the selected preset and update its settings
      const { error, data } = await supabase
        .from('theme_settings')
        .update({
          brightness: selectedPreset.brightness,
          contrast: selectedPreset.contrast,
          saturation: selectedPreset.saturation,
          is_active: true
        })
        .eq('id', presetId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      
      console.log('Theme preset activated:', data);
      
      toast({
        title: 'Success',
        description: 'Theme activated and settings saved',
      });
      
      // Fetch updated presets to refresh the UI
      await fetchThemePresets();
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
      
      const { error, data } = await supabase
        .from('theme_settings')
        .update(dataToUpdate)
        .eq('id', selectedPreset.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      
      console.log('Theme settings saved:', data);
      
      // If this is the active preset, the changes will affect the active theme
      if (selectedPreset.is_active) {
        console.log('Updated active preset, changes will propagate globally');
      }
      
      toast({
        title: 'Success',
        description: 'Theme settings saved',
      });
      
      await fetchThemePresets();
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
