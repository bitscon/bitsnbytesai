
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { ApiSetting, GroupedSettings } from './types';
import { SettingsLoading } from './SettingsLoading';
import { SettingsEmpty } from './SettingsEmpty';
import { SettingCategory } from './SettingCategory';

interface SettingsContentProps {
  isLoading: boolean;
  settings: ApiSetting[];
  groupedSettings: GroupedSettings;
  editableValues: Record<string, string>;
  isSaving: Record<string, boolean>;
  showSecrets: Record<string, boolean>;
  handleInputChange: (key: string, value: string) => void;
  handleSaveSetting: (key: string) => void;
  handleToggleChange: (key: string, currentValue: string) => void;
  toggleShowSecret: (key: string) => void;
  formatSettingName: (name: string) => string;
}

export function SettingsContent({
  isLoading,
  settings,
  groupedSettings,
  editableValues,
  isSaving,
  showSecrets,
  handleInputChange,
  handleSaveSetting,
  handleToggleChange,
  toggleShowSecret,
  formatSettingName
}: SettingsContentProps) {
  return (
    <CardContent className="pt-6">
      {isLoading ? (
        <SettingsLoading />
      ) : settings.length === 0 ? (
        <SettingsEmpty />
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => 
            categorySettings.length > 0 && (
              <SettingCategory
                key={category}
                category={category}
                settings={categorySettings}
                editableValues={editableValues}
                isSaving={isSaving}
                showSecrets={showSecrets}
                handleInputChange={handleInputChange}
                handleSaveSetting={handleSaveSetting}
                handleToggleChange={handleToggleChange}
                toggleShowSecret={toggleShowSecret}
                formatSettingName={formatSettingName}
              />
            )
          )}
        </div>
      )}
    </CardContent>
  );
}
