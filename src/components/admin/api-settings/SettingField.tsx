
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Save, EyeOff, Eye, CheckCircle2 } from 'lucide-react';
import { ApiSetting } from './types';

interface SettingFieldProps {
  setting: ApiSetting;
  editableValue: string;
  isSaving: boolean;
  showSecret: boolean;
  onInputChange: (value: string) => void;
  onSave: () => void;
  onToggleChange: () => void;
  onToggleShowSecret: () => void;
  formatSettingName: (name: string) => string;
}

export function SettingField({
  setting,
  editableValue,
  isSaving,
  showSecret,
  onInputChange,
  onSave,
  onToggleChange,
  onToggleShowSecret,
  formatSettingName
}: SettingFieldProps) {
  const isSecret = setting.key_name.includes('SECRET') || 
                   setting.key_name.includes('KEY') || 
                   setting.key_name.includes('PASSWORD');
  const isToggle = setting.key_value === 'true' || setting.key_value === 'false';
  
  if (isToggle) {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={setting.key_value === 'true'}
          onCheckedChange={onToggleChange}
          disabled={isSaving}
        />
        <Label>{setting.key_value === 'true' ? 'Enabled' : 'Disabled'}</Label>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          type={isSecret && !showSecret ? 'password' : 'text'}
          value={editableValue}
          onChange={(e) => onInputChange(e.target.value)}
          className={`pr-10 ${setting.has_value ? 'border-green-200 dark:border-green-800' : ''}`}
          placeholder={`Enter ${formatSettingName(setting.key_name)}`}
        />
        {setting.has_value && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      {isSecret && (
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={onToggleShowSecret}
          className="flex-shrink-0"
        >
          {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      )}
      <Button
        variant={setting.has_value ? "secondary" : "default"}
        size="sm"
        onClick={onSave}
        disabled={isSaving}
        className="flex-shrink-0 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Save className="h-4 w-4 mr-1" />
        )}
        Save
      </Button>
    </div>
  );
}
