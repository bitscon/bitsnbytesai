
import React from 'react';
import { Card } from '@/components/ui/card';
import { SettingsError } from './api-settings/SettingsError';
import { useApiSettings } from '@/hooks/useApiSettings';
import { SettingsCardHeader } from './api-settings/SettingsCardHeader';
import { SettingsContent } from './api-settings/SettingsContent';
import { SettingsCardFooter } from './api-settings/SettingsCardFooter';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertVariant } from './api-settings/types';

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
    handleExpiryDateChange,
    handleRenewKey,
    toggleShowSecret,
    formatSettingName
  } = useApiSettings();
  
  const { toast } = useToast();
  
  const handleCheckExpiringKeys = () => {
    const now = new Date();
    const expiringKeys = settings.filter(setting => {
      if (!setting.expires_at) return false;
      
      try {
        const expiryDate = new Date(setting.expires_at);
        return expiryDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      } catch (error) {
        return false;
      }
    });
    
    if (expiringKeys.length > 0) {
      toast({
        title: `${expiringKeys.length} key(s) expiring soon`,
        description: expiringKeys.map(k => formatSettingName(k.key_name)).join(', '),
        variant: "warning" as AlertVariant,
      });
    } else {
      toast({
        title: "No keys expiring soon",
        description: "All keys are valid for at least 30 days",
      });
    }
  };

  return (
    <div className="space-y-6">
      {hasError && <SettingsError onRetry={fetchSettings} />}

      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-2"
          onClick={handleCheckExpiringKeys}
        >
          Check Expiring Keys
        </Button>
      </div>

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
          handleExpiryDateChange={handleExpiryDateChange}
          handleRenewKey={handleRenewKey}
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
