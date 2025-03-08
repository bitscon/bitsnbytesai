
import { ThemeSettings } from '@/components/admin/theme/types';

export function useThemeSliderChanges(
  selectedPreset: ThemeSettings | null,
  setSelectedPreset: (preset: ThemeSettings | null) => void,
  updatePreviewStyle: (preset: ThemeSettings) => void
) {
  const handleSliderChange = (name: 'brightness' | 'contrast' | 'saturation', value: number[]) => {
    if (!selectedPreset) return;
    
    const newValue = value[0];
    const updatedPreset = { ...selectedPreset, [name]: newValue };
    setSelectedPreset(updatedPreset);
    updatePreviewStyle(updatedPreset);
  };

  return { handleSliderChange };
}
