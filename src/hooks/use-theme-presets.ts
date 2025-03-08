
import { useThemePresetSelection } from './theme/use-theme-preset-selection';
import { useThemePreview } from './theme/use-theme-preview';
import { useThemeSliderChanges } from './theme/use-theme-slider-changes';
import { useThemePresetActions } from './theme/use-theme-preset-actions';
import { useThemePresetCreation } from './theme/use-theme-preset-creation';

export function useThemePresets(currentMode: 'light' | 'dark') {
  const {
    themePresets,
    selectedPreset,
    setSelectedPreset,
    isLoading,
    fetchThemePresets,
    handlePresetChange
  } = useThemePresetSelection(currentMode);

  const { previewStyle, updatePreviewStyle } = useThemePreview(selectedPreset);
  
  const { handleSliderChange } = useThemeSliderChanges(
    selectedPreset,
    setSelectedPreset,
    updatePreviewStyle
  );

  const {
    isSaving,
    handleDeletePreset,
    handleActivatePreset,
    savePresetSettings
  } = useThemePresetActions(selectedPreset, fetchThemePresets, currentMode);

  const { handleCreatePreset } = useThemePresetCreation(
    currentMode,
    fetchThemePresets,
    handlePresetChange
  );

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
