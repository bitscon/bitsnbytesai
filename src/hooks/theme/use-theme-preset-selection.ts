
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeSettings } from '@/components/admin/theme/types';

export function useThemePresetSelection(currentMode: 'light' | 'dark') {
  const [themePresets, setThemePresets] = useState<ThemeSettings[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ThemeSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
      } else if (data.length > 0) {
        setSelectedPreset(data[0]);
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

  const handlePresetChange = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(preset);
    }
  };

  useEffect(() => {
    fetchThemePresets();
  }, [currentMode]);

  return {
    themePresets,
    selectedPreset,
    setSelectedPreset,
    isLoading,
    fetchThemePresets,
    handlePresetChange
  };
}
