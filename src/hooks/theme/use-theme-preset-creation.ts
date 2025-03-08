
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeSettings } from '@/components/admin/theme/types';

export function useThemePresetCreation(
  currentMode: 'light' | 'dark',
  fetchThemePresets: () => Promise<void>,
  handlePresetChange: (presetId: string) => void
) {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

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

  return {
    handleCreatePreset
  };
}
