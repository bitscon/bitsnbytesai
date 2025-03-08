
import { useState, useEffect } from 'react';
import { ThemeSettings } from '@/components/admin/theme/types';

export function useThemePreview(selectedPreset: ThemeSettings | null) {
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});

  const updatePreviewStyle = (preset: ThemeSettings) => {
    setPreviewStyle({
      filter: `brightness(${preset.brightness}%) contrast(${preset.contrast}%) saturate(${preset.saturation}%)`,
      transition: 'filter 0.3s ease'
    });
  };

  useEffect(() => {
    if (selectedPreset) {
      updatePreviewStyle(selectedPreset);
    }
  }, [selectedPreset]);

  return { previewStyle, updatePreviewStyle };
}
