
import React from 'react';
import { ApiSetting } from './types';
import { SettingField } from './SettingField';
import { CreditCard, Settings } from 'lucide-react';

interface SettingCategoryProps {
  category: string;
  settings: ApiSetting[];
  editableValues: Record<string, string>;
  isSaving: Record<string, boolean>;
  showSecrets: Record<string, boolean>;
  handleInputChange: (key: string, value: string) => void;
  handleSaveSetting: (key: string) => void;
  handleToggleChange: (key: string, currentValue: string) => void;
  toggleShowSecret: (key: string) => void;
  formatSettingName: (name: string) => string;
}

export function SettingCategory({
  category,
  settings,
  editableValues,
  isSaving,
  showSecrets,
  handleInputChange,
  handleSaveSetting,
  handleToggleChange,
  toggleShowSecret,
  formatSettingName
}: SettingCategoryProps) {
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PayPal':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'Stripe':
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      default:
        return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        {getCategoryIcon(category)}
        <h2 className="text-lg font-semibold">{category}</h2>
      </div>
      <div className="grid gap-y-8 gap-x-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
        {settings.map((setting) => (
          <div key={setting.key_name} className="space-y-3 bg-muted/30 p-4 rounded-md transition-all hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground/90">{formatSettingName(setting.key_name)}</h3>
                {setting.description && (
                  <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                )}
              </div>
            </div>
            <SettingField
              setting={setting}
              editableValue={editableValues[setting.key_name] || ''}
              isSaving={isSaving[setting.key_name] || false}
              showSecret={showSecrets[setting.key_name] || false}
              onInputChange={(value) => handleInputChange(setting.key_name, value)}
              onSave={() => handleSaveSetting(setting.key_name)}
              onToggleChange={() => handleToggleChange(setting.key_name, setting.key_value)}
              onToggleShowSecret={() => toggleShowSecret(setting.key_name)}
              formatSettingName={formatSettingName}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
