
import React from 'react';
import { Card } from '@/components/ui/card';
import { SettingsError } from './api-settings/SettingsError';
import { useApiSettings } from '@/hooks/useApiSettings';
import { SettingsCardHeader } from './api-settings/SettingsCardHeader';
import { SettingsContent } from './api-settings/SettingsContent';
import { SettingsCardFooter } from './api-settings/SettingsCardFooter';

export function ApiSettingsPanel() {
  const {
    settings,
    isLoading,
    isSaving,
    editableValues,
    showSecrets,
    hasError,
    groupedSettings,
    fetchSettings,
    handleToggleChange,
    handleInputChange,
    handleSaveSetting,
    toggleShowSecret,
    formatSettingName
  } = useApiSettings();

  return (
    <div className="space-y-6">
      {hasError && <SettingsError onRetry={fetchSettings} />}

      <Card className="border-border/40 shadow-md">
        <SettingsCardHeader />
        <SettingsContent 
          isLoading={isLoading}
          settings={settings}
          groupedSettings={groupedSettings}
          editableValues={editableValues}
          isSaving={isSaving}
          showSecrets={showSecrets}
          handleInputChange={handleInputChange}
          handleSaveSetting={handleSaveSetting}
          handleToggleChange={handleToggleChange}
          toggleShowSecret={toggleShowSecret}
          formatSettingName={formatSettingName}
        />
        <SettingsCardFooter 
          isLoading={isLoading}
          onRefresh={fetchSettings}
        />
      </Card>
    </div>
  );
}
