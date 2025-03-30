
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/context/theme/ThemeContext';
import { ThemeControls } from './theme/ThemeControls';
import { ThemePreview } from './theme/ThemePreview';
import { CreateThemePreset } from './theme/CreateThemePreset';
import { ActivateThemeDialog } from './theme/ActivateThemeDialog';
import { ThemeModeSwitcher } from './theme/ThemeModeSwitcher';
import { ThemeActions } from './theme/ThemeActions';
import { useThemePresets } from '@/hooks/use-theme-presets';

export function ThemeCustomization() {
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('light');
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState<boolean>(false);
  const [isCreatePresetOpen, setIsCreatePresetOpen] = useState<boolean>(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const {
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
  } = useThemePresets(currentMode);

  useEffect(() => {
    setCurrentMode(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleModeChange = (value: string) => {
    const newMode = value as 'light' | 'dark';
    setCurrentMode(newMode);
    
    if ((newMode === 'dark' && !isDarkMode) || (newMode === 'light' && isDarkMode)) {
      toggleTheme();
    }
  };

  const handleCreatePresetSubmit = async (preset: Omit<typeof selectedPreset, 'id'>) => {
    const success = await handleCreatePreset(preset);
    if (success) {
      setIsCreatePresetOpen(false);
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
            <ThemeModeSwitcher 
              currentMode={currentMode}
              onModeChange={handleModeChange}
              onCreatePresetClick={() => setIsCreatePresetOpen(true)}
            >
              <ThemeControls
                themePresets={themePresets}
                selectedPreset={selectedPreset}
                isLoading={isLoading}
                isSaving={isSaving}
                onPresetChange={handlePresetChange}
                onSliderChange={handleSliderChange}
                onDeletePreset={handleDeletePreset}
                onActivatePreset={() => {
                  if (selectedPreset && selectedPreset.id) {
                    setIsActivateDialogOpen(true);
                  }
                }}
              />
            </ThemeModeSwitcher>

            <ThemePreview previewStyle={previewStyle} />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <ThemeActions 
          selectedPreset={selectedPreset}
          isLoading={isLoading}
          isSaving={isSaving}
          onReset={fetchThemePresets}
          onSave={savePresetSettings}
          onActivateClick={() => selectedPreset && !selectedPreset.is_active ? setIsActivateDialogOpen(true) : null}
        />
      </CardFooter>

      <CreateThemePreset 
        open={isCreatePresetOpen} 
        onOpenChange={setIsCreatePresetOpen}
        onSubmit={handleCreatePresetSubmit}
        isLoading={isSaving}
      />

      <ActivateThemeDialog
        open={isActivateDialogOpen}
        onOpenChange={setIsActivateDialogOpen}
        selectedPreset={selectedPreset}
        onActivate={handleActivatePreset}
        isLoading={isSaving}
      />
    </Card>
  );
}
