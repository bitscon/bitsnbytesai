
import { useThemePresetSelection } from './theme/use-theme-preset-selection';
import { useThemePreview } from './theme/use-theme-preview';
import { useThemeSliderChanges } from './theme/use-theme-slider-changes';
import { useThemePresetActions } from './theme/use-theme-preset-actions';
import { useThemePresetCreation } from './theme/use-theme-preset-creation';

export function useThemePresets(currentMode: 'light' | 'dark') {
  // Get theme presets and selection functionality
  const {
    themePresets,
    selectedPreset,
    setSelectedPreset,
    isLoading,
    fetchThemePresets,
    handlePresetChange
  } = useThemePresetSelection(currentMode);

  // Preview styles for the theme editor
  const { previewStyle, updatePreviewStyle } = useThemePreview(selectedPreset);
  
  // Slider control functionality
  const { handleSliderChange } = useThemeSliderChanges(
    selectedPreset,
    setSelectedPreset,
    updatePreviewStyle
  );

  // Theme action functionality (save, delete, activate)
  const {
    isSaving,
    handleDeletePreset,
    handleActivatePreset,
    savePresetSettings
  } = useThemePresetActions(selectedPreset, fetchThemePresets, currentMode);

  // Theme creation functionality
  const { handleCreatePreset } = useThemePresetCreation(
    currentMode,
    fetchThemePresets,
    handlePresetChange
  );

  // Return all functionality for the theme preset manager
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
